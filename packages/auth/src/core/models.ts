export type UserId = string

export type Provider = "local" | "google"

export type RoleInAccount = "owner" | "admin" | "member"

export type AccountStatus = "active" | "restricted"

export interface AuthUserProfile {
  name: string
  jobRole?: string | null
  expectedUsers?: number | null
}

/**
 * Entidad de dominio. El núcleo razona sobre esta forma;
 * cada adapter (Mongo, memoria, HTTP) es responsable de hidratarla.
 */
export interface AuthUser {
  id: UserId
  email: string
  emailVerified: boolean
  provider: Provider
  passwordHash: string | null
  profile: AuthUserProfile
  accountOwnerId: UserId | null
  roleInAccount: RoleInAccount
  status: AccountStatus
  onboardingCompleted: boolean
  createdAt: Date
}

/**
 * Proyección de usuario segura para exponer al cliente.
 * Nunca incluye passwordHash ni datos de OTP.
 */
export interface AuthSessionUser {
  id: UserId
  email: string
  emailVerified: boolean
  provider: Provider
  profile: AuthUserProfile
  roleInAccount: RoleInAccount
  status: AccountStatus
  onboardingCompleted: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  accessTtlMs: number
  refreshTtlMs: number
}

export interface AuthResult {
  user: AuthSessionUser
  tokens: AuthTokens
}

export interface OtpState {
  hash: string
  expiresAt: Date
  attempts: number
  sentAt: Date
}

export interface OnboardingProfileInput {
  jobRole: string
  expectedUsers: number
}

export function toSessionUser(user: AuthUser): AuthSessionUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    provider: user.provider,
    profile: user.profile,
    roleInAccount: user.roleInAccount,
    status: user.status,
    onboardingCompleted: user.onboardingCompleted,
  }
}
