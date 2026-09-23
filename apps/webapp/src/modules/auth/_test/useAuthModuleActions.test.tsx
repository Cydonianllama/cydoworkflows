import type { AuthClientPort, AuthSessionUser } from "@cydo/auth"
import { AuthProvider } from "@cydo/auth/client"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { useAuthModuleActions } from "../actions/useAuthModuleActions"
import { AuthModuleStoreProvider, useAuthModuleStore } from "../store"

const sessionUser: AuthSessionUser = {
  id: "u1",
  email: "ada@cydo.app",
  emailVerified: true,
  provider: "local",
  profile: { name: "Ada" },
  roleInAccount: "owner",
  status: "active",
  onboardingCompleted: false,
}

function createClient(overrides: Partial<AuthClientPort> = {}): AuthClientPort {
  return {
    register: vi.fn(async () => ({ status: true, data: { requiresOtp: true as const, email: sessionUser.email } })),
    verifyOtp: vi.fn(async () => ({ status: true, data: { user: sessionUser } })),
    resendOtp: vi.fn(async () => ({ status: true, data: { sent: true } })),
    login: vi.fn(async () => ({ status: true, data: { user: sessionUser } })),
    loginWithGoogle: vi.fn(async () => ({ status: true, data: { user: sessionUser } })),
    refresh: vi.fn(async () => null),
    logout: vi.fn(async () => undefined),
    me: vi.fn(async () => null),
    completeOnboarding: vi.fn(async () => ({ status: true, data: { user: sessionUser, invited: [] } })),
    ...overrides,
  }
}

function makeWrapper(client: AuthClientPort) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <AuthProvider client={client} bootstrap={false}>
          <AuthModuleStoreProvider>{children}</AuthModuleStoreProvider>
        </AuthProvider>
      </MemoryRouter>
    )
  }
}

function useHarness() {
  return { actions: useAuthModuleActions(), store: useAuthModuleStore() }
}

describe("useAuthModuleActions", () => {
  it("guarda el email pendiente cuando el registro funciona", async () => {
    const client = createClient()
    const { result } = renderHook(useHarness, { wrapper: makeWrapper(client) })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.registerAction({
        name: "Ada",
        email: "ada@cydo.app",
        password: "supersecret",
      })
    })

    expect(ok).toBe(true)
    expect(result.current.store.pendingEmail).toBe("ada@cydo.app")
    expect(result.current.store.loading).toBe(false)
  })

  it("es resiliente cuando el registro devuelve null", async () => {
    const client = createClient({ register: vi.fn(async () => null) })
    const { result } = renderHook(useHarness, { wrapper: makeWrapper(client) })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.registerAction({ name: "Ada", email: "a@b.com", password: "supersecret" })
    })

    expect(ok).toBe(false)
    expect(result.current.store.pendingEmail).toBe("")
  })

  it("no deja la sesión marcada cuando el OTP es inválido", async () => {
    const client = createClient({
      verifyOtp: vi.fn(async () => ({ status: false, data: { user: sessionUser }, message: "Código inválido" })),
    })
    const { result } = renderHook(useHarness, { wrapper: makeWrapper(client) })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.verifyOtpAction({ email: "ada@cydo.app", code: "000000" })
    })

    expect(ok).toBe(false)
    expect(result.current.store.loading).toBe(false)
  })

  it("completa el login con Google", async () => {
    const client = createClient()
    const { result } = renderHook(useHarness, { wrapper: makeWrapper(client) })

    await act(async () => {
      await result.current.actions.loginWithGoogleAction({ idToken: "token" })
    })

    expect(client.loginWithGoogle).toHaveBeenCalledWith({ idToken: "token" })
  })
})
