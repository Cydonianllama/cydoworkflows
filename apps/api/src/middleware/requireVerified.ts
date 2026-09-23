import { AUTH_ERROR, AuthError } from "@cydo/auth"
import type { RequestHandler } from "express"

export const requireVerified: RequestHandler = (req, _res, next) => {
  if (!req.user?.emailVerified) {
    next(new AuthError(AUTH_ERROR.EMAIL_NOT_VERIFIED, "Debes verificar tu email"))
    return
  }
  next()
}
