import type { AuthUser, OnboardingProfileInput, OtpState, Provider, UserId } from "../models"

/**
 * Puertos (adapters) que el núcleo de auth necesita.
 * El núcleo NO conoce Mongo, Express, Resend ni Google:
 * sólo estas interfaces. La API inyecta las implementaciones reales
 * y la webapp inyecta el adapter HTTP.
 */

export interface ClockPort {
  now(): Date
}

export interface CryptoPort {
  randomOtp(digits: number): string
  randomToken(bytes: number): string
  sha256(value: string): string
}

export interface CreateUserInput {
  email: string
  passwordHash: string | null
  provider: Provider
  emailVerified: boolean
  profile: { name: string }
  accountOwnerId: UserId | null
  roleInAccount: AuthUser["roleInAccount"]
}

export interface UpdateUserInput {
  emailVerified?: boolean
  passwordHash?: string | null
  profile?: Partial<AuthUser["profile"]>
  accountOwnerId?: UserId | null
  roleInAccount?: AuthUser["roleInAccount"]
  status?: AuthUser["status"]
  onboardingCompleted?: boolean
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>
  findById(id: UserId): Promise<AuthUser | null>
  create(input: CreateUserInput): Promise<AuthUser>
  update(id: UserId, patch: UpdateUserInput): Promise<AuthUser | null>
  saveOtp(id: UserId, otp: OtpState | null): Promise<void>
  readOtp(id: UserId): Promise<OtpState | null>
  listMembers(accountOwnerId: UserId): Promise<AuthUser[]>
  deleteById(id: UserId): Promise<void>
}

export interface RefreshTokenRecord {
  id: string
  userId: UserId
  tokenHash: string
  familyId: string
  expiresAt: Date
  revokedAt: Date | null
}

export interface RefreshTokenRepository {
  create(record: Omit<RefreshTokenRecord, "id">): Promise<RefreshTokenRecord>
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>
  revoke(id: string): Promise<void>
  revokeFamily(familyId: string): Promise<void>
  revokeAllForUser(userId: UserId): Promise<void>
}

export interface InviteNotification {
  to: string
  inviterName: string
  acceptUrl: string
}

export interface EmailPort {
  sendOtp(to: string, code: string): Promise<void>
  sendInvite(params: InviteNotification): Promise<void>
}

export interface PasswordHasherPort {
  hash(plain: string): Promise<string>
  compare(plain: string, hash: string): Promise<boolean>
}

export interface AccessTokenPayload {
  sub: UserId
}

export interface TokenSignerPort {
  signAccess(payload: AccessTokenPayload): string
  verifyAccess(token: string): AccessTokenPayload | null
  readonly accessTtlMs: number
  readonly refreshTtlMs: number
}

export interface VerifiedOAuthProfile {
  email: string
  name: string
  emailVerified: boolean
}

export interface OAuthVerifierPort {
  verifyGoogleIdToken(idToken: string): Promise<VerifiedOAuthProfile | null>
}

export interface AuthPorts {
  users: UserRepository
  refreshTokens: RefreshTokenRepository
  email: EmailPort
  hasher: PasswordHasherPort
  tokens: TokenSignerPort
  oauth: OAuthVerifierPort
  crypto: CryptoPort
  clock: ClockPort
}

export interface AuthConfig {
  otpTtlMs: number
  otpMaxAttempts: number
  otpResendCooldownMs: number
  otpDigits: number
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  otpTtlMs: 10 * 60 * 1000,
  otpMaxAttempts: 5,
  otpResendCooldownMs: 60 * 1000,
  otpDigits: 6,
}

export type { OnboardingProfileInput }
