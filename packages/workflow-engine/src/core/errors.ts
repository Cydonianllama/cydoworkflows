export const ENGINE_ERROR = {
  INVALID_CRON: "INVALID_CRON",
  INVALID_TIMEZONE: "INVALID_TIMEZONE",
  INVALID_TRIGGER_CONFIG: "INVALID_TRIGGER_CONFIG",
  WEBHOOK_TOKEN_MISSING: "WEBHOOK_TOKEN_MISSING",
  TRIGGER_NOT_FOUND: "TRIGGER_NOT_FOUND",
  UNSUPPORTED_TRIGGER_NODE: "UNSUPPORTED_TRIGGER_NODE",
} as const

export type EngineErrorCode = (typeof ENGINE_ERROR)[keyof typeof ENGINE_ERROR]

export class EngineError extends Error {
  readonly code: EngineErrorCode

  constructor(code: EngineErrorCode, message?: string) {
    super(message ?? code)
    this.name = "EngineError"
    this.code = code
  }

  static is(error: unknown): error is EngineError {
    return error instanceof EngineError
  }
}
