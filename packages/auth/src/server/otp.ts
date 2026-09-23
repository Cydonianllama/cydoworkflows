import type { AuthConfig, ClockPort, CryptoPort } from "../core/contracts/ports"
import { AUTH_ERROR, AuthError } from "../core/errors"
import type { OtpState } from "../core/models"

export function buildOtpState(
  crypto: CryptoPort,
  clock: ClockPort,
  config: AuthConfig,
): { code: string; state: OtpState } {
  const now = clock.now()
  const code = crypto.randomOtp(config.otpDigits)
  return {
    code,
    state: {
      hash: crypto.sha256(code),
      expiresAt: new Date(now.getTime() + config.otpTtlMs),
      attempts: 0,
      sentAt: now,
    },
  }
}

export function assertOtpResendAllowed(state: OtpState | null, clock: ClockPort, config: AuthConfig): void {
  if (!state) return
  const elapsed = clock.now().getTime() - state.sentAt.getTime()
  if (elapsed < config.otpResendCooldownMs) {
    const seconds = Math.ceil((config.otpResendCooldownMs - elapsed) / 1000)
    throw new AuthError(AUTH_ERROR.OTP_COOLDOWN, `Espera ${seconds}s antes de pedir un nuevo código`)
  }
}

export type OtpCheck = "ok" | "expired" | "attempts" | "mismatch"

export function checkOtp(
  state: OtpState | null,
  code: string,
  crypto: CryptoPort,
  clock: ClockPort,
  config: AuthConfig,
): OtpCheck {
  if (!state) return "mismatch"
  if (state.attempts >= config.otpMaxAttempts) return "attempts"
  if (state.expiresAt.getTime() < clock.now().getTime()) return "expired"
  if (state.hash !== crypto.sha256(code)) return "mismatch"
  return "ok"
}

export function otpErrorFromCheck(check: Exclude<OtpCheck, "ok">): AuthError {
  switch (check) {
    case "expired":
      return new AuthError(AUTH_ERROR.OTP_EXPIRED, "El código expiró, solicita uno nuevo")
    case "attempts":
      return new AuthError(AUTH_ERROR.OTP_ATTEMPTS_EXCEEDED, "Demasiados intentos, solicita un nuevo código")
    default:
      return new AuthError(AUTH_ERROR.INVALID_OTP, "Código inválido")
  }
}
