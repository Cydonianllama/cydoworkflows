# AGENTS.md — Mapa del monorepo `cydo-workflows`

Monorepo **pnpm** con dos aplicaciones y un paquete compartido. Este documento es el mapa de
referencia para agentes y personas: dónde vive cada cosa, qué reglas no se rompen y cómo se
conectan las piezas.

---

## 1. Estructura

```
cydo-workflows/
├─ package.json               # scripts root (dev/build/test/typecheck)
├─ pnpm-workspace.yaml        # packages: apps/*, packages/*
├─ tsconfig.base.json         # config TypeScript compartida
├─ AGENTS.md
├─ packages/
│  └─ auth/                   # @cydo/auth — núcleo de auth + adapters
└─ apps/
   ├─ api/                    # @cydo/api — Express + Mongoose
   └─ webapp/                 # @cydo/webapp — Vite + React + Tailwind + shadcn
```

| Paquete | Nombre | Responsabilidad |
|---|---|---|
| `packages/auth` | `@cydo/auth` | Núcleo de autenticación isomórfico (contratos, DTOs, reglas) + adapters. **No conoce** Mongo, Express, Resend ni Google. |
| `apps/api` | `@cydo/api` | API REST. Implementa los adapters de `@cydo/auth` y expone los módulos de negocio. |
| `apps/webapp` | `@cydo/webapp` | SPA. Consume `@cydo/auth/client` y la API vía `lib/api`. |

---

## 2. Comandos

```bash
pnpm install                 # una vez, en la raíz

pnpm dev                     # api (:4000) + webapp (:5173) en paralelo
pnpm build                   # build de todos los paquetes
pnpm test                    # tests de todos los paquetes
pnpm typecheck               # tsc --noEmit en todos los paquetes

pnpm api dev                 # sólo el API
pnpm api seed:user           # crea un usuario verificado para entrar sin OTP
pnpm webapp dev              # sólo el webapp
pnpm auth typecheck          # sólo un paquete

pnpm --filter @cydo/api test # exec puntual
```

Entorno: **Node ≥ 20**, **pnpm ≥ 9**.
> En este entorno `NODE_ENV` puede venir en `production`; para instalar devDependencies usá
> `NODE_ENV=development pnpm install`.

---

## 3. `packages/auth` (`@cydo/auth`)

Tres entrypoints, según dónde se consuma:

| Entrypoint | Contenido | Consumidor |
|---|---|---|
| `@cydo/auth` | `core/`: modelos, DTOs, errores, validaciones zod, contratos (puertos) | ambos |
| `@cydo/auth/server` | `AuthService`, OTP, rotación de tokens, permisos | `apps/api` |
| `@cydo/auth/client` | `AuthProvider`, hooks, `GoogleButton`, `OtpInput`, guards | `apps/webapp` |

```
packages/auth/src/
├─ core/
│  ├─ models.ts                # AuthUser, AuthSessionUser, AuthTokens, toSessionUser
│  ├─ dto.ts                   # RegisterRequest, VerifyOtpRequest, CompleteOnboardingRequest…
│  ├─ errors.ts                # AuthError + códigos (EMAIL_TAKEN, INVALID_OTP, …)
│  ├─ validation.ts            # schemas zod reutilizados por API y webapp
│  ├─ cookies.ts               # nombres y opciones de las cookies de sesión
│  └─ contracts/
│     ├─ ports.ts              # AuthPorts: UserRepository, RefreshTokenRepository, OtpRepository,
│     │                        # EmailPort, PasswordHasherPort, TokenSignerPort, OAuthVerifierPort,
│     │                        # CryptoPort, ClockPort
│     └─ authClient.ts         # AuthClientPort + ClientEnvelope (contrato del cliente)
├─ server/
│  ├─ AuthService.ts           # register, verifyOtp, resendOtp, login, loginWithGoogle,
│  │                           # refresh, logout, me, completeOnboarding, createSession
│  ├─ otp.ts                   # buildOtpState / checkOtp / cooldown
│  ├─ tokens.ts                # emisión y rotación de refresh tokens
│  └─ permissions.ts           # can(subject, permission) + catálogo de permisos
└─ client/
   ├─ AuthProvider.tsx         # recibe `client: AuthClientPort` y expone estado + acciones
   ├─ hooks/                   # useAuth, useAuthActions, useAuthUser…
   └─ components/              # GoogleButton, OtpInput, RequireAuth, RequireOnboarding
```

**Idea central:** `AuthService` sólo depende de `AuthPorts`. La persistencia se enchufa al
construirlo. `apps/api/src/setup/container.ts` es el único lugar que decide *con qué* se conecta:

```ts
export const authPorts: AuthPorts = {
  users: new MongoUserRepository(),          // ← persistencia real
  refreshTokens: new MongoRefreshTokenRepository(),
  email: new ResendEmailAdapter(),
  hasher: new BcryptHasherAdapter(),
  tokens: new JwtTokenSignerAdapter(),
  oauth: new GoogleOAuthVerifier(),
  crypto: new NodeCryptoAdapter(),
  clock: new SystemClockAdapter(),
}
export const authService = new AuthService(authPorts, { /* config OTP/TTL */ })
```

**Permisos** (`server/permissions.ts`):

| Rol / estado | Permisos |
|---|---|
| `owner` | todo (`workflow:*`, `member:*`) |
| `admin` | workflows + `member:invite`, `member:restrict` |
| `member` | `workflow:read`, `workflow:create`, `workflow:delete` |
| `restricted` | sólo `workflow:read` (modo lectura) |

### Cambiar la persistencia de auth

Implementá los puertos de `core/contracts/ports.ts` (por ejemplo `PostgresUserRepository`) y
reemplazá las instancias en `apps/api/src/setup/container.ts`. **No se toca** `AuthService`,
los controllers, ni el webapp.

---

## 4. `apps/api` (`@cydo/api`)

```
apps/api/src/
├─ index.ts               # bootstrap: connectDb → createApp → listen → graceful shutdown
├─ setup/
│  ├─ app.ts              # express app: helmet, cors, cookieParser, json, routers, errorHandler
│  ├─ env.ts              # validación zod de process.env (falla rápido)
│  ├─ db.ts               # conexión mongoose
│  ├─ container.ts        # wiring puertos → adapters
│  ├─ response.ts         # sendOk / sendCreated / sendList + buildPagination
│  ├─ sessionCookies.ts   # set/clear/read de las cookies de sesión
│  └─ adapters/           # Mongo repos, Resend, bcrypt, JWT, Google, node crypto, clock
├─ middleware/
│  ├─ requireAuth.ts           # cookie → JWT → req.user
│  ├─ requireVerified.ts       # email verificado
│  ├─ requireNotRestricted.ts  # bloquea escrituras a miembros restringidos
│  ├─ requirePermission.ts     # requirePermission('workflow:create') usando can()
│  ├─ validate.ts              # validate(schema, 'body'|'query'|'params')
│  └─ errorHandler.ts          # AuthError / ZodError / Mongo → ResponseApi
├─ modules/
│  ├─ auth/          # model.ts (User, RefreshToken) · dto.ts · controller.ts · routes.ts
│  ├─ onboarding/    # dto · controller · routes
│  ├─ users/         # perfil y resumen de cuenta
│  ├─ workflows/     # model · dto · service · controller · routes
│  └─ members/       # model (Invite) · dto · service · controller · routes
├─ types/express.d.ts # augmentation de Request con `user`
└─ utils/             # asyncHandler, duration, regex, account
```

Todos los routers se montan bajo **`/api/v1`**. Todas las respuestas usan el sobre
`{ status, data, message?, pagination? }`.

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| `POST` | `/auth/register` | público → crea usuario + envía OTP |
| `POST` | `/auth/verify-otp` | público → verifica y emite cookies |
| `POST` | `/auth/resend-otp` | público (cooldown 60 s) |
| `POST` | `/auth/login` | público |
| `POST` | `/auth/google` | público (`{ idToken }`) |
| `POST` | `/auth/refresh` | cookie de refresh |
| `POST` | `/auth/logout` | cookie de refresh |
| `GET` | `/auth/me` | sesión |
| `POST` | `/onboarding/complete` | sesión + verificado |
| `GET` | `/users/me` | sesión → perfil + stats |
| `PATCH` | `/users/me` | sesión |
| `GET` | `/workflows?page&limit&search` | `workflow:read` |
| `POST` | `/workflows` | `workflow:create` + no restringido |
| `DELETE` | `/workflows/:id` | `workflow:delete` + no restringido |
| `GET` | `/members` | `member:invite` |
| `POST` | `/members/invite` | `member:invite` |
| `PATCH` | `/members/:id/role` | `member:role` |
| `PATCH` | `/members/:id/restrict` | `member:restrict` |
| `DELETE` | `/members/:id` | `member:remove` |
| `GET` | `/invites/:token` | público |
| `POST` | `/invites/:token/accept` | público → crea miembro + cookies |

### Modelo de datos (single-tenant)

El **dueño de la cuenta es el propio usuario** (`accountOwnerId: null`). Los miembros apuntan a
él con `accountOwnerId`. `resolveAccountId(user)` (`utils/account.ts`) devuelve `accountOwnerId ?? id`
y se usa para scopear workflows y miembros.

- `User`: email, provider (`local|google`), passwordHash, otp, profile, accountOwnerId, roleInAccount, status, onboardingCompleted
- `RefreshToken`: userId, tokenHash, familyId, expiresAt, revokedAt (rotación + reuse detection)
- `Workflow`: ownerId, name, createdBy
- `Invite`: email, accountOwnerId, roleInAccount, tokenHash, expiresAt, status

---

## 5. `apps/webapp` (`@cydo/webapp`)

```
apps/webapp/src/
├─ main.tsx            # providers: AuthProvider → ConfirmProvider → Router → App
├─ App.tsx             # rutas públicas, /onboarding y layout protegido
├─ setup/
│  ├─ env.ts           # validación de import.meta.env
│  ├─ axiosSetup.ts    # instancia axios + interceptor 401 → refresh → retry
│  └─ authClient.ts    # implementación de AuthClientPort (enchufa @cydo/auth a la API)
├─ layout/             # AppLayout, Aside, Header, guards (ProtectedRoute/OnboardingRoute)
├─ modules/            # auth · onboarding · home · workflows · settings
├─ features/           # notification · confirm · globalSearch
├─ components/
│  ├─ ui/              # shadcn (button, input, dialog, table, select, card, badge…)
│  └─ …                # EmptyState, Pagination, PageHeader
├─ lib/
│  ├─ api/             # auth · workflows · members (DTOs + requests por caso de uso)
│  ├─ types/           # ResponseApi, ResponsePagination
│  └─ eventBus/        # eventBus, events (mapa tipado), useEvent
└─ utils/              # cn, format, permissions, error
```

### Rutas

| Ruta | Guard |
|---|---|
| `/login`, `/register`, `/verify-otp`, `/accept-invite/:token` | públicas |
| `/onboarding` | `RequireOnboarding` (sesión + verificado, sin onboarding) |
| `/`, `/workflows`, `/settings` | `ProtectedRoute` → `AppLayout` (sesión + verificado + onboarding) |

### Anatomía obligatoria de un módulo

```
modules/{modulo}/
├─ _test/          # tests de los ACTIONS (no UI)
├─ catalog/        # opciones estáticas de selects / configuraciones (sólo si aplica)
├─ components/     # componentes con estado interno; props sin modelo de negocio
│  └─ ComponentName/componentName.tsx + componentNameProps.ts (+ .css si hace falta)
├─ actions/        # useXActions — ÚNICO lugar que llama a lib/api y muta datos
├─ hooks/          # abstracciones propias del módulo
├─ store/          # contrato agnóstico + implementación zustand aislada + provider
├─ compositions/   # unen actions/hooks con components
├─ scaffold/       # layout propio del módulo (sólo si se pide)
└─ screen.tsx      # vista principal (puede haber screens/ adicionales)
```

**Reglas duras de dependencia**

- `components/` **no** importa `store`, `actions` ni `lib/api`. Props puras.
- `actions/` es el único que importa `lib/api`; maneja `toast.error` y el `finally` de loading.
- `store/` define el **contrato** (`*.contract.ts`) sin mencionar la librería; `*.zustand.ts` es
  el único archivo que importa `zustand`; el resto del módulo consume `useXStore()` vía context.
- `catalog/` sólo alimenta selects **a través de compositions**; un componente nunca lo consulta.
- Los módulos son herméticos: **no** se importan entre sí (ver §6).

### `lib/api` — convención de endpoints

Una carpeta por sección (`auth`, `workflows`, `members`), con un archivo por caso de uso y un
`*DTO.tsx` con los contratos:

```ts
export interface ListWorkflowsRequestDTO { page: number; limit: number; search?: string }
export interface ListWorkflowsResponseDTO { items: WorkflowDTO[] }

export const listWorkflowsRequest = async (
  data: ListWorkflowsRequestDTO,
): Promise<ResponseApi<ListWorkflowsResponseDTO> | null> => {
  try {
    const req = await api.get("/workflows", { params: data })
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) return ex.response?.data ?? null
    return null
  }
}
```

`ResponseApi<T>` envuelve **siempre** la respuesta y `ResponsePagination` viaja en `pagination`.

---

## 6. Comunicación entre módulos (EventBus)

Los módulos **no se importan entre sí**. Cuando ocurre un hecho que puede interesar a otros, se
publica en el bus (`lib/eventBus`):

```
workflows/actions ──emit("workflow.created")──▶ eventBus ──▶ features/notification (toast)
settings/actions  ──emit("member.invited")───▶ eventBus ──▶ features/notification
onboarding/actions──emit("onboarding.completed")─▶ eventBus ──▶ home
```

Reglas:

- El evento es un **hecho ocurrido** (`workflow.created`), no una orden a otro módulo.
- Siempre tipado: `AppEvents` en `lib/eventBus/events.ts` define nombre → payload.
- Quien publica **no conoce** a quien escucha; quien escucha reacciona de forma independiente.
- El bus es **sólo** para comunicación entre módulos, nunca para reemplazar llamadas dentro del
  mismo módulo.
- Suscripción en React: `useEvent("workflow.created", ({ name }) => …)`.

Eventos actuales: `auth.user.registered`, `auth.user.verified`, `auth.session.started`,
`auth.session.ended`, `onboarding.completed`, `workflow.created`, `workflow.deleted`,
`member.invited`, `member.removed`, `member.restricted`, `member.role.changed`.

---

## 7. Variables de entorno

Cada app tiene su `.env` (ignorado por git) y su `.env.example` versionado.

**`apps/api/.env`** — `NODE_ENV`, `PORT`, `MONGO_URI`, `MONGO_DB_NAME` (sobreescribe la base
del URI si está definido), `CORS_ORIGIN`, `WEBAPP_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `COOKIE_SECURE`,
`OTP_TTL_MINUTES`, `OTP_MAX_ATTEMPTS`, `OTP_RESEND_COOLDOWN_SECONDS`, `OTP_DIGITS`,
`GOOGLE_CLIENT_ID`, `RESEND_API_KEY`, `RESEND_FROM`.

**`apps/webapp/.env`** — `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.

Notas de desarrollo:
- Sin `RESEND_API_KEY` el OTP y los enlaces de invitación se **imprimen en la consola del API**.
- Sin `VITE_GOOGLE_CLIENT_ID` el botón de Google muestra un aviso en lugar del widget.
- `pnpm api seed:user` crea (o resetea) un usuario ya verificado para entrar sin OTP.
  Se personaliza con `SEED_EMAIL`, `SEED_PASSWORD` y `SEED_NAME` (defaults:
  `admin@cydo.app` / `Cydo12345` / `Cydo Admin`).

---

## 8. Flujos

1. **Registro** → `POST /auth/register` (envía OTP) → `/verify-otp` → cookies emitidas →
   `onboardingCompleted=false` → `/onboarding`.
2. **Google** → `GoogleButton` (GIS) devuelve `idToken` → `POST /auth/google` → cookies →
   onboarding si es la primera vez.
3. **Onboarding** → `POST /onboarding/complete` con `jobRole`, `expectedUsers` e `invites[]`
   → emails de invitación → emite `onboarding.completed` → `/`.
4. **Invitación** → email con `${WEBAPP_URL}/accept-invite/:token` → `POST /invites/:token/accept`
   crea el miembro vinculado al dueño y abre sesión (sin onboarding).
5. **Workflows** → crear (sólo nombre), listar con `page/limit/search`, eliminar con
   `ConfirmProvider` + `DELETE /workflows/:id`.
6. **Settings** → invitar, restringir (modo lectura) y eliminar miembros; también cambiar rol.

Las cookies `cydo_access` / `cydo_refresh` son `httpOnly`; el interceptor de axios renueva la
sesión de forma transparente ante un 401.

---

## 9. Tests

Los tests viven en `_test/` **dentro de cada módulo del front** y cubren los `actions`
(resiliencia ante cambios de API/modelo), no la UI.

```bash
pnpm test                          # todo
pnpm --filter @cydo/webapp test    # actions de los módulos
pnpm --filter @cydo/api test       # AuthService (puertos en memoria) + rutas (supertest)
```

- **webapp**: Vitest + jsdom + Testing Library. Las requests de `lib/api` se mockean con `vi.mock`.
- **api**: `tests/authService.test.ts` usa adapters en memoria (`tests/inMemoryPorts.ts`) para
  probar el núcleo de auth sin base de datos; `tests/http.test.ts` valida rutas, validación y
  permisos con `supertest` y el container mockeado.
