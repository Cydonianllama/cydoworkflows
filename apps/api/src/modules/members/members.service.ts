import {
  AUTH_ERROR,
  AuthError,
  type AuthResult,
  type AuthUser,
  type RoleInAccount,
} from "@cydo/auth"
import mongoose from "mongoose"
import { authPorts, authService } from "../../setup/container"
import { env } from "../../setup/env"
import { InviteModel, toInviteDTO, type InviteDTO, type InviteRole } from "./members.model"
import type { InviteMemberInput } from "./members.dto"

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface MemberDTO {
  id: string
  email: string
  name: string
  roleInAccount: RoleInAccount
  status: "active" | "restricted"
  isOwner: boolean
  createdAt: string
}

function toMemberDTO(user: AuthUser): MemberDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.profile.name,
    roleInAccount: user.roleInAccount,
    status: user.status,
    isOwner: user.roleInAccount === "owner",
    createdAt: user.createdAt.toISOString(),
  }
}

export class MembersService {
  async list(accountId: string): Promise<{ members: MemberDTO[]; invites: InviteDTO[] }> {
    const [owner, members, invites] = await Promise.all([
      authPorts.users.findById(accountId),
      authPorts.users.listMembers(accountId),
      InviteModel.find({ accountOwnerId: accountId, status: "pending" }).sort({ createdAt: -1 }),
    ])

    const all = owner ? [owner, ...members] : members
    return {
      members: all.map(toMemberDTO),
      invites: invites.map(toInviteDTO),
    }
  }

  async invite(
    accountId: string,
    inviter: AuthUser,
    input: InviteMemberInput,
  ): Promise<InviteDTO> {
    const email = input.email.toLowerCase()

    const [existingUser, pendingInvite] = await Promise.all([
      authPorts.users.findByEmail(email),
      InviteModel.findOne({ email, accountOwnerId: accountId, status: "pending" }),
    ])

    if (existingUser) throw new AuthError(AUTH_ERROR.EMAIL_TAKEN, "Ese email ya pertenece a un usuario")
    if (pendingInvite) throw new AuthError(AUTH_ERROR.EMAIL_TAKEN, "Ya existe una invitación pendiente para ese email")

    const token = authPorts.crypto.randomToken(24)
    const doc = await InviteModel.create({
      email,
      accountOwnerId: new mongoose.Types.ObjectId(accountId),
      roleInAccount: input.role,
      tokenHash: authPorts.crypto.sha256(token),
      expiresAt: new Date(authPorts.clock.now().getTime() + INVITE_TTL_MS),
      status: "pending",
      invitedBy: new mongoose.Types.ObjectId(inviter.id),
    })

    await emailPortSafe({
      to: email,
      inviterName: inviter.profile.name,
      acceptUrl: `${env.WEBAPP_URL}/accept-invite/${token}`,
    })

    return toInviteDTO(doc)
  }

  async inviteMany(
    accountId: string,
    inviter: AuthUser,
    invites: InviteMemberInput[],
  ): Promise<string[]> {
    const invited: string[] = []
    for (const invite of invites) {
      try {
        const created = await this.invite(accountId, inviter, invite)
        invited.push(created.email)
      } catch (error) {
        if (AuthError.is(error) && error.code === AUTH_ERROR.EMAIL_TAKEN) continue
        throw error
      }
    }
    return invited
  }

  async updateRole(accountId: string, memberId: string, role: InviteRole): Promise<MemberDTO> {
    const user = await this.findMember(accountId, memberId)
    const updated = await authPorts.users.update(user.id, { roleInAccount: role })
    if (!updated) throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Miembro no encontrado")
    return toMemberDTO(updated)
  }

  async setRestricted(accountId: string, memberId: string, restricted: boolean): Promise<MemberDTO> {
    const user = await this.findMember(accountId, memberId)
    const updated = await authPorts.users.update(user.id, { status: restricted ? "restricted" : "active" })
    if (!updated) throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Miembro no encontrado")
    return toMemberDTO(updated)
  }

  async remove(accountId: string, memberId: string): Promise<{ id: string }> {
    const user = await this.findMember(accountId, memberId)
    await authPorts.users.deleteById(user.id)
    return { id: user.id }
  }

  async getInviteByToken(token: string): Promise<{ email: string; roleInAccount: InviteRole; expiresAt: string }> {
    const invite = await this.findPendingInvite(token)
    return {
      email: invite.email,
      roleInAccount: invite.roleInAccount,
      expiresAt: invite.expiresAt.toISOString(),
    }
  }

  async acceptInvite(token: string, input: { name: string; password: string }): Promise<AuthResult> {
    const invite = await this.findPendingInvite(token)
    const email = invite.email.toLowerCase()

    const existing = await authPorts.users.findByEmail(email)
    if (existing) throw new AuthError(AUTH_ERROR.EMAIL_TAKEN, "Ese email ya está registrado")

    const passwordHash = await authPorts.hasher.hash(input.password)
    const created = await authPorts.users.create({
      email,
      passwordHash,
      provider: "local",
      emailVerified: true,
      profile: { name: input.name },
      accountOwnerId: invite.accountOwnerId.toString(),
      roleInAccount: invite.roleInAccount,
    })

    await authPorts.users.update(created.id, { onboardingCompleted: true })
    invite.status = "accepted"
    await invite.save()

    return authService.createSession(created.id)
  }

  private async findMember(accountId: string, memberId: string): Promise<AuthUser> {
    const user = await authPorts.users.findById(memberId)
    if (!user || user.accountOwnerId !== accountId) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Miembro no encontrado")
    }
    if (user.roleInAccount === "owner") {
      throw new AuthError(AUTH_ERROR.FORBIDDEN, "No puedes modificar al dueño de la cuenta")
    }
    return user
  }

  private async findPendingInvite(token: string) {
    const invite = await InviteModel.findOne({ tokenHash: authPorts.crypto.sha256(token), status: "pending" })
    if (!invite) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "Invitación inválida o ya usada")

    if (invite.expiresAt.getTime() < authPorts.clock.now().getTime()) {
      invite.status = "revoked"
      await invite.save()
      throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "La invitación expiró")
    }

    return invite
  }
}

async function emailPortSafe(params: { to: string; inviterName: string; acceptUrl: string }): Promise<void> {
  try {
    await authPorts.email.sendInvite(params)
  } catch (error) {
    console.error("[members] no se pudo enviar la invitación", error)
  }
}

export const membersService = new MembersService()
