import { AUTH_ERROR, AuthError } from "@cydo/auth"
import type { RequestHandler } from "express"

/** Un miembro restringido queda en modo sólo lectura. */
export const requireNotRestricted: RequestHandler = (req, _res, next) => {
  if (req.user?.status === "restricted") {
    next(new AuthError(AUTH_ERROR.ACCOUNT_RESTRICTED, "Tu acceso está restringido"))
    return
  }
  next()
}
