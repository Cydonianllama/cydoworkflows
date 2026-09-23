import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildClearCookieOptions,
  buildCookieOptions,
  type AuthTokens,
} from "@cydo/auth"
import type { Request, Response } from "express"
import { env } from "./env"

export function setSessionCookies(res: Response, tokens: AuthTokens): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, buildCookieOptions(tokens.accessTtlMs, env.COOKIE_SECURE))
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, buildCookieOptions(tokens.refreshTtlMs, env.COOKIE_SECURE))
}

export function clearSessionCookies(res: Response): void {
  const options = buildClearCookieOptions(env.COOKIE_SECURE)
  res.clearCookie(ACCESS_COOKIE, options)
  res.clearCookie(REFRESH_COOKIE, options)
}

export function readRefreshCookie(req: Request): string | null {
  const value: unknown = req.cookies?.[REFRESH_COOKIE]
  return typeof value === "string" && value.length > 0 ? value : null
}
