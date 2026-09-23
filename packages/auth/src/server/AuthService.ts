import type { AuthConfig, AuthPorts } from "../core/contracts/ports"
import { DEFAULT_AUTH_CONFIG } from "../core/contracts/ports"
import type {
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  VerifyOtpRequest,
} from "../core/dto"
import { AUTH_ERROR, AuthError, assertAuth } from "../core/errors"
import type { AuthResult, AuthSessionUser, AuthUser, OnboardingProfileInput } from "../core/models"
import { toSessionUser } from "../core/models"
import { assertOtpResendAllowed, buildOtpState, checkOtp, otpErrorFromCheck } from "./otp"
import { issueRefreshToken, newFamilyId } from "./tokens"

/**
 * Núcleo de autenticación. Sólo depende de puertos (AuthPorts):
 * no conoce Mongo, Express, Resend ni Google. La persistencia se
 * conecta al construir el servicio con los adapters correspondientes.
 */
export class AuthService {
  private readonly config: AuthConfig

  constructor(
    private readonly ports: AuthPorts,
    config: Partial<AuthConfig> = {},
  ) {
    this.config = { ...DEFAULT_AUTH_CONFIG, ...config }
  }

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    const email = input.email.toLowerCase()
    const existing = await this.ports.users.findByEmail(email)

    if (existing?.emailVerified) {
      const hint = existing.provider === "google" ? " con Google" : ""
      throw new AuthError(AUTH_ERROR.EMAIL_TAKEN, `Ese email ya está registrado${hint}`)
    }

    const passwordHash = await this.ports.hasher.hash(input.password)
    const { code, state } = buildOtpState(this.ports.crypto, this.ports.clock, this.config)

    if (existing) {
      await this.ports.users.update(existing.id, {
        passwordHash,
        profile: { ...existing.profile, name: input.name },
      })
      await this.ports.users.saveOtp(existing.id, state)
    } else {
      const created = await this.ports.users.create({
        email,
        passwordHash,
        provider: "local",
        emailVerified: false,
        profile: { name: input.name },
        accountOwnerId: null,
        roleInAccount: "owner",
      })
      await this.ports.users.saveOtp(created.id, state)
    }

    await this.ports.email.sendOtp(email, code)
    return { requiresOtp: true, email }
  }

  async verifyOtp(input: VerifyOtpRequest): Promise<AuthResult> {
    const user = await this.ports.users.findByEmail(input.email.toLowerCase())
    assertAuth(user, AUTH_ERROR.USER_NOT_FOUND, "Usuario no encontrado")

    const otp = await this.ports.users.readOtp(user.id)
    const check = checkOtp(otp, input.code, this.ports.crypto, this.ports.clock, this.config)

    if (check !== "ok") {
      if (check === "mismatch" && otp) {
        await this.ports.users.saveOtp(user.id, { ...otp, attempts: otp.attempts + 1 })
      }
      throw otpErrorFromCheck(check)
    }

    await this.ports.users.update(user.id, { emailVerified: true })
    await this.ports.users.saveOtp(user.id, null)

    const verified = await this.ports.users.findById(user.id)
    assertAuth(verified, AUTH_ERROR.USER_NOT_FOUND)
    return this.issue(verified)
  }

  async resendOtp(input: ResendOtpRequest): Promise<{ sent: boolean }> {
    const user = await this.ports.users.findByEmail(input.email.toLowerCase())
    assertAuth(user, AUTH_ERROR.USER_NOT_FOUND, "Usuario no encontrado")
    if (user.emailVerified) return { sent: true }

    const current = await this.ports.users.readOtp(user.id)
    assertOtpResendAllowed(current, this.ports.clock, this.config)

    const { code, state } = buildOtpState(this.ports.crypto, this.ports.clock, this.config)
    await this.ports.users.saveOtp(user.id, state)
    await this.ports.email.sendOtp(user.email, code)
    return { sent: true }
  }

  async login(input: LoginRequest): Promise<AuthResult> {
    const user = await this.ports.users.findByEmail(input.email.toLowerCase())
    if (!user?.passwordHash) {
      throw new AuthError(AUTH_ERROR.INVALID_CREDENTIALS, "Credenciales inválidas")
    }

    const valid = await this.ports.hasher.compare(input.password, user.passwordHash)
    if (!valid) throw new AuthError(AUTH_ERROR.INVALID_CREDENTIALS, "Credenciales inválidas")
    if (!user.emailVerified) throw new AuthError(AUTH_ERROR.EMAIL_NOT_VERIFIED, "Debes verificar tu email")

    return this.issue(user)
  }

  async loginWithGoogle(input: GoogleLoginRequest): Promise<AuthResult> {
    const profile = await this.ports.oauth.verifyGoogleIdToken(input.idToken)
    if (!profile) throw new AuthError(AUTH_ERROR.OAUTH_FAILED, "No pudimos validar tu cuenta de Google")

    const email = profile.email.toLowerCase()
    let user = await this.ports.users.findByEmail(email)

    if (!user) {
      user = await this.ports.users.create({
        email,
        passwordHash: null,
        provider: "google",
        emailVerified: true,
        profile: { name: profile.name },
        accountOwnerId: null,
        roleInAccount: "owner",
      })
    } else if (!user.emailVerified) {
      const updated = await this.ports.users.update(user.id, { emailVerified: true })
      assertAuth(updated, AUTH_ERROR.USER_NOT_FOUND)
      user = updated
    }

    return this.issue(user)
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const record = await this.ports.refreshTokens.findByHash(this.ports.crypto.sha256(refreshToken))
    if (!record) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "Sesión inválida")

    if (record.revokedAt) {
      await this.ports.refreshTokens.revokeFamily(record.familyId)
      throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "Sesión revocada")
    }

    if (record.expiresAt.getTime() < this.ports.clock.now().getTime()) {
      await this.ports.refreshTokens.revoke(record.id)
      throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "Sesión expirada")
    }

    const user = await this.ports.users.findById(record.userId)
    assertAuth(user, AUTH_ERROR.USER_NOT_FOUND)

    await this.ports.refreshTokens.revoke(record.id)
    return this.issue(user, record.familyId)
  }

  async logout(refreshToken: string | null): Promise<void> {
    if (!refreshToken) return
    const record = await this.ports.refreshTokens.findByHash(this.ports.crypto.sha256(refreshToken))
    if (record) await this.ports.refreshTokens.revoke(record.id)
  }

  async me(userId: string): Promise<AuthSessionUser> {
    const user = await this.ports.users.findById(userId)
    assertAuth(user, AUTH_ERROR.USER_NOT_FOUND, "Usuario no encontrado")
    return toSessionUser(user)
  }

  /** Emite una sesión nueva para un usuario ya existente (p. ej. al aceptar una invitación). */
  async createSession(userId: string): Promise<AuthResult> {
    const user = await this.ports.users.findById(userId)
    assertAuth(user, AUTH_ERROR.USER_NOT_FOUND, "Usuario no encontrado")
    return this.issue(user)
  }

  async completeOnboarding(userId: string, input: OnboardingProfileInput): Promise<AuthSessionUser> {
    const user = await this.ports.users.update(userId, {
      onboardingCompleted: true,
      profile: { jobRole: input.jobRole, expectedUsers: input.expectedUsers },
    })
    assertAuth(user, AUTH_ERROR.USER_NOT_FOUND, "Usuario no encontrado")
    return toSessionUser(user)
  }

  private async issue(user: AuthUser, familyId?: string): Promise<AuthResult> {
    const family = familyId ?? newFamilyId(this.ports.crypto)
    const { token, record } = issueRefreshToken(
      this.ports.crypto,
      this.ports.clock,
      this.ports.tokens,
      user.id,
      family,
    )
    await this.ports.refreshTokens.create(record)

    return {
      user: toSessionUser(user),
      tokens: {
        accessToken: this.ports.tokens.signAccess({ sub: user.id }),
        refreshToken: token,
        accessTtlMs: this.ports.tokens.accessTtlMs,
        refreshTtlMs: this.ports.tokens.refreshTtlMs,
      },
    }
  }
}
