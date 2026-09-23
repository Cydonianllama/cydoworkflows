import type { AccessTokenPayload, TokenSignerPort } from "@cydo/auth"
import jwt from "jsonwebtoken"
import { env } from "../env"
import { parseDuration } from "../../utils/duration"

export class JwtTokenSignerAdapter implements TokenSignerPort {
  readonly accessTtlMs: number
  readonly refreshTtlMs: number

  constructor() {
    this.accessTtlMs = parseDuration(env.ACCESS_TOKEN_TTL)
    this.refreshTtlMs = parseDuration(env.REFRESH_TOKEN_TTL)
  }

  signAccess(payload: AccessTokenPayload): string {
    return jwt.sign({ sub: payload.sub }, env.JWT_ACCESS_SECRET, {
      expiresIn: Math.floor(this.accessTtlMs / 1000),
    })
  }

  verifyAccess(token: string): AccessTokenPayload | null {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET)
      if (typeof decoded === "string" || !decoded.sub) return null
      return { sub: String(decoded.sub) }
    } catch {
      return null
    }
  }
}
