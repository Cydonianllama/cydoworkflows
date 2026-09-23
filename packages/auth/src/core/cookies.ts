export const ACCESS_COOKIE = "cydo_access"
export const REFRESH_COOKIE = "cydo_refresh"

export interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: "lax" | "strict" | "none"
  path: string
  maxAge: number
}

export function buildCookieOptions(ttlMs: number, secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ttlMs,
  }
}

export function buildClearCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  }
}
