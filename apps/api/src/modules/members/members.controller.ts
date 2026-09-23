import { AUTH_ERROR, AuthError, type AuthSessionPayload } from "@cydo/auth"
import type { Request, Response } from "express"
import { sendCreated, sendOk } from "../../setup/response"
import { setSessionCookies } from "../../setup/sessionCookies"
import { resolveAccountId } from "../../utils/account"
import { membersService } from "./members.service"
import type { AcceptInviteInput, InviteMemberInput } from "./members.dto"

function currentUser(req: Request) {
  if (!req.user) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "No hay sesión activa")
  return req.user
}

export async function listMembersHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const data = await membersService.list(resolveAccountId(user))
  sendOk(res, data)
}

export async function inviteMemberHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const invite = await membersService.invite(resolveAccountId(user), user, req.body as InviteMemberInput)
  sendCreated(res, { invite }, "Invitación enviada")
}

export async function updateMemberRoleHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const { role } = req.body as { role: "admin" | "member" }
  const member = await membersService.updateRole(resolveAccountId(user), id, role)
  sendOk(res, { member }, "Rol actualizado")
}

export async function restrictMemberHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const { restricted } = req.body as { restricted: boolean }
  const member = await membersService.setRestricted(resolveAccountId(user), id, restricted)
  sendOk(res, { member }, restricted ? "Miembro restringido" : "Restricción removida")
}

export async function removeMemberHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const removed = await membersService.remove(resolveAccountId(user), id)
  sendOk(res, removed, "Miembro eliminado")
}

export async function getInviteHandler(req: Request, res: Response): Promise<void> {
  const { token } = req.params as { token: string }
  const invite = await membersService.getInviteByToken(token)
  sendOk(res, invite)
}

export async function acceptInviteHandler(req: Request, res: Response): Promise<void> {
  const { token } = req.params as { token: string }
  const result = await membersService.acceptInvite(token, req.body as AcceptInviteInput)
  setSessionCookies(res, result.tokens)
  sendOk<AuthSessionPayload>(res, { user: result.user }, "Te uniste a la cuenta")
}
