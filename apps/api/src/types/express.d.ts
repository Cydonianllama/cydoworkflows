import type { AuthUser } from "@cydo/auth"

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
