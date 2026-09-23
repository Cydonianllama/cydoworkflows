import { AUTH_ERROR, AuthError, toSessionUser } from "@cydo/auth"
import type { Request, Response } from "express"
import { authPorts } from "../../setup/container"
import { sendOk } from "../../setup/response"
import { resolveAccountId } from "../../utils/account"
import { UserModel } from "../auth/auth.model"
import { WorkflowModel } from "../workflows/workflows.model"
import type { UpdateProfileInput } from "./users.dto"

export async function getMeHandler(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "No hay sesión activa")

  const accountId = resolveAccountId(user)
  const [memberCount, workflowCount] = await Promise.all([
    UserModel.countDocuments({ accountOwnerId: accountId }),
    WorkflowModel.countDocuments({ ownerId: accountId }),
  ])

  sendOk(res, {
    user: toSessionUser(user),
    stats: { members: memberCount + 1, workflows: workflowCount },
  })
}

export async function updateMeHandler(req: Request, res: Response): Promise<void> {
  const user = req.user
  if (!user) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "No hay sesión activa")

  const body = req.body as UpdateProfileInput
  const updated = await authPorts.users.update(user.id, {
    profile: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.jobRole !== undefined ? { jobRole: body.jobRole } : {}),
    },
  })
  if (!updated) throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Usuario no encontrado")

  sendOk(res, { user: toSessionUser(updated) }, "Perfil actualizado")
}
