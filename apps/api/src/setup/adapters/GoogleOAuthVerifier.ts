import type { OAuthVerifierPort, VerifiedOAuthProfile } from "@cydo/auth"
import { OAuth2Client } from "google-auth-library"
import { env } from "../env"

export class GoogleOAuthVerifier implements OAuthVerifierPort {
  private readonly client: OAuth2Client

  constructor() {
    this.client = new OAuth2Client(env.GOOGLE_CLIENT_ID)
  }

  async verifyGoogleIdToken(idToken: string): Promise<VerifiedOAuthProfile | null> {
    if (!env.GOOGLE_CLIENT_ID) return null

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      })
      const payload = ticket.getPayload()
      if (!payload?.email) return null

      return {
        email: payload.email,
        name: payload.name ?? payload.email.split("@")[0] ?? "Usuario",
        emailVerified: payload.email_verified ?? false,
      }
    } catch {
      return null
    }
  }
}
