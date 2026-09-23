import { ACCESS_COOKIE, AUTH_ERROR, AuthError } from "@cydo/auth"
import type { RequestHandler } from "express"
import { authPorts } from "../setup/container"

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE]
    if (!token) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "No hay sesión activa")

    const payload = authPorts.tokens.verifyAccess(token)
    if (!payload) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "Sesión inválida")

    const user = await authPorts.users.findById(payload.sub)
    if (!user) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "Sesión inválida")

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
