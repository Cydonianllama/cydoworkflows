import { AuthService, type AuthPorts } from "@cydo/auth/server"
import { BcryptHasherAdapter } from "./adapters/BcryptHasherAdapter"
import { GoogleOAuthVerifier } from "./adapters/GoogleOAuthVerifier"
import { JwtTokenSignerAdapter } from "./adapters/JwtTokenSignerAdapter"
import { MongoRefreshTokenRepository } from "./adapters/MongoRefreshTokenRepository"
import { MongoUserRepository } from "./adapters/MongoUserRepository"
import { NodeCryptoAdapter } from "./adapters/NodeCryptoAdapter"
import { ResendEmailAdapter } from "./adapters/ResendEmailAdapter"
import { SystemClockAdapter } from "./adapters/SystemClockAdapter"
import { env } from "./env"

/**
 * Aquí se "conecta" el núcleo de auth con la persistencia real.
 * El núcleo (@cydo/auth) no conoce ninguno de estos adapters.
 */
export const authPorts: AuthPorts = {
  users: new MongoUserRepository(),
  refreshTokens: new MongoRefreshTokenRepository(),
  email: new ResendEmailAdapter(),
  hasher: new BcryptHasherAdapter(),
  tokens: new JwtTokenSignerAdapter(),
  oauth: new GoogleOAuthVerifier(),
  crypto: new NodeCryptoAdapter(),
  clock: new SystemClockAdapter(),
}

export const authService = new AuthService(authPorts, {
  otpTtlMs: env.OTP_TTL_MINUTES * 60_000,
  otpMaxAttempts: env.OTP_MAX_ATTEMPTS,
  otpResendCooldownMs: env.OTP_RESEND_COOLDOWN_SECONDS * 1000,
  otpDigits: env.OTP_DIGITS,
})

export const emailPort = authPorts.email
export const userRepository = authPorts.users
