import { AUTH_ERROR, AuthError, type AuthUser } from "@cydo/auth"

/**
 * Single-tenant por usuario: el dueño de la cuenta es el propio usuario,
 * y los miembros apuntan a él mediante accountOwnerId.
 */
export function resolveAccountId(user: AuthUser): string {
  return user.accountOwnerId ?? user.id
}

export function assertNotRestricted(user: AuthUser): void {
  if (user.status === "restricted") {
    throw new AuthError(AUTH_ERROR.ACCOUNT_RESTRICTED, "Tu acceso está restringido")
  }
}
