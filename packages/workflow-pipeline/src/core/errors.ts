export const PIPELINE_ERROR = {
  NODE_NOT_FOUND: "NODE_NOT_FOUND",
  RUN_LIMIT_REACHED: "RUN_LIMIT_REACHED",
  NODE_EXECUTION_FAILED: "NODE_EXECUTION_FAILED",
  RUN_CANCELLED: "RUN_CANCELLED",
} as const

export type PipelineErrorCode = (typeof PIPELINE_ERROR)[keyof typeof PIPELINE_ERROR]

export class PipelineError extends Error {
  readonly code: PipelineErrorCode

  constructor(code: PipelineErrorCode, message?: string) {
    super(message ?? code)
    this.name = "PipelineError"
    this.code = code
  }

  static is(error: unknown): error is PipelineError {
    return error instanceof PipelineError
  }
}
