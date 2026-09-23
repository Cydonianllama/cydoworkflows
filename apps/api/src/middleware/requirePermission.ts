import { AUTH_ERROR, AuthError, can, type Permission } from "@cydo/auth/server"
import type { RequestHandler } from "express"

export function requirePermission(permission: Permission): RequestHandler {
  return (req, _res, next) => {
    const user = req.user
    if (!user) {
      next(new AuthError(AUTH_ERROR.INVALID_TOKEN, "No hay sesión activa"))
      return
    }
    if (!can(user, permission)) {
      next(new AuthError(AUTH_ERROR.FORBIDDEN, "No tienes permisos para esta acción"))
      return
    }
    next()
  }
}
