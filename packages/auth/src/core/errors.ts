export const AUTH_ERROR = {
  VALIDATION: "VALIDATION",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  INVALID_OTP: "INVALID_OTP",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_ATTEMPTS_EXCEEDED: "OTP_ATTEMPTS_EXCEEDED",
  OTP_COOLDOWN: "OTP_COOLDOWN",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_TOKEN: "INVALID_TOKEN",
  OAUTH_FAILED: "OAUTH_FAILED",
  ACCOUNT_RESTRICTED: "ACCOUNT_RESTRICTED",
  FORBIDDEN: "FORBIDDEN",
  UNEXPECTED: "UNEXPECTED",
} as const

export type AuthErrorCode = (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR]

const STATUS_BY_CODE: Record<AuthErrorCode, number> = {
  [AUTH_ERROR.VALIDATION]: 422,
  [AUTH_ERROR.EMAIL_TAKEN]: 409,
  [AUTH_ERROR.INVALID_CREDENTIALS]: 401,
  [AUTH_ERROR.EMAIL_NOT_VERIFIED]: 403,
  [AUTH_ERROR.INVALID_OTP]: 422,
  [AUTH_ERROR.OTP_EXPIRED]: 410,
  [AUTH_ERROR.OTP_ATTEMPTS_EXCEEDED]: 429,
  [AUTH_ERROR.OTP_COOLDOWN]: 429,
  [AUTH_ERROR.USER_NOT_FOUND]: 404,
  [AUTH_ERROR.INVALID_TOKEN]: 401,
  [AUTH_ERROR.OAUTH_FAILED]: 401,
  [AUTH_ERROR.ACCOUNT_RESTRICTED]: 403,
  [AUTH_ERROR.FORBIDDEN]: 403,
  [AUTH_ERROR.UNEXPECTED]: 500,
}

export class AuthError extends Error {
  readonly code: AuthErrorCode
  readonly status: number

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code)
    this.name = "AuthError"
    this.code = code
    this.status = STATUS_BY_CODE[code]
  }

  static is(error: unknown): error is AuthError {
    return error instanceof AuthError
  }
}

export function assertAuth(condition: unknown, code: AuthErrorCode, message?: string): asserts condition {
  if (!condition) throw new AuthError(code, message)
}
