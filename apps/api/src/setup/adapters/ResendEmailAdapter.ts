import type { EmailPort, InviteNotification } from "@cydo/auth"
import { Resend } from "resend"
import { env } from "../env"
import { inviteEmailTemplate, otpEmailTemplate } from "./emailTemplates"

export class ResendEmailAdapter implements EmailPort {
  private readonly client: Resend | null

  constructor() {
    this.client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null
  }

  async sendOtp(to: string, code: string): Promise<void> {
    if (!this.client) {
      console.warn(`[email:dev] RESEND_API_KEY no configurada. OTP para ${to}: ${code}`)
      return
    }

    await this.client.emails.send({
      from: env.RESEND_FROM,
      to,
      subject: `${code} es tu código de verificación`,
      html: otpEmailTemplate(code),
    })
  }

  async sendInvite({ to, inviterName, acceptUrl }: InviteNotification): Promise<void> {
    if (!this.client) {
      console.warn(`[email:dev] RESEND_API_KEY no configurada. Invitación para ${to}: ${acceptUrl}`)
      return
    }

    await this.client.emails.send({
      from: env.RESEND_FROM,
      to,
      subject: `${inviterName} te invitó a Cydo`,
      html: inviteEmailTemplate(inviterName, acceptUrl),
    })
  }
}
