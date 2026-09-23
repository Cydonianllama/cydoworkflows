import { AUTH_ERROR, AuthError, type CompleteOnboardingInput } from "@cydo/auth"
import type { Request, Response } from "express"
import { authService } from "../../setup/container"
import { sendOk } from "../../setup/response"
import { resolveAccountId } from "../../utils/account"
import { membersService } from "../members/members.service"

export async function completeOnboardingHandler(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "No hay sesión activa")

  const { jobRole, expectedUsers, invites } = req.body as CompleteOnboardingInput

  const session = await authService.completeOnboarding(user.id, { jobRole, expectedUsers })

  const invited =
    invites && invites.length > 0
      ? await membersService.inviteMany(resolveAccountId(user), user, invites)
      : []

  sendOk(res, { user: session, invited }, "Onboarding completado")
}
