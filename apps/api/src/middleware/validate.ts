import { AUTH_ERROR, AuthError } from "@cydo/auth"
import type { RequestHandler } from "express"
import type { ZodTypeAny } from "zod"

type Source = "body" | "query" | "params"

export function validate(schema: ZodTypeAny, source: Source = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ")
      next(new AuthError(AUTH_ERROR.VALIDATION, message))
      return
    }

    if (source === "body") {
      req.body = result.data
    } else if (source === "params") {
      req.params = result.data as typeof req.params
    } else {
      Object.assign(req.query, result.data)
    }

    next()
  }
}
