export type MemberRole = "owner" | "admin" | "member"
export type MemberStatus = "active" | "restricted"
export type InviteRole = "admin" | "member"
export type InviteStatus = "pending" | "accepted" | "revoked"

export interface MemberDTO {
  id: string
  email: string
  name: string
  roleInAccount: MemberRole
  status: MemberStatus
  isOwner: boolean
  createdAt: string
}

export interface InviteDTO {
  id: string
  email: string
  roleInAccount: InviteRole
  status: InviteStatus
  expiresAt: string
  createdAt: string
}

/* GET /members */
export interface ListMembersResponseDTO {
  members: MemberDTO[]
  invites: InviteDTO[]
}

/* POST /members/invite */
export interface InviteMemberRequestDTO {
  email: string
  role: InviteRole
}

export interface InviteMemberResponseDTO {
  invite: InviteDTO
}

/* PATCH /members/:id/role */
export interface UpdateMemberRoleRequestDTO {
  role: InviteRole
}

export interface UpdateMemberRoleResponseDTO {
  member: MemberDTO
}

/* PATCH /members/:id/restrict */
export interface RestrictMemberRequestDTO {
  restricted: boolean
}

export interface RestrictMemberResponseDTO {
  member: MemberDTO
}

/* DELETE /members/:id */
export interface RemoveMemberResponseDTO {
  id: string
}

/* GET /invites/:token */
export interface GetInviteResponseDTO {
  email: string
  roleInAccount: InviteRole
  expiresAt: string
}

/* POST /invites/:token/accept */
export interface AcceptInviteRequestDTO {
  name: string
  password: string
}

export interface AcceptInviteResponseDTO {
  user: {
    id: string
    email: string
    profile: { name: string }
    onboardingCompleted: boolean
  }
}

/* GET /users/me */
export interface AccountOverviewResponseDTO {
  user: {
    id: string
    email: string
    profile: { name: string; jobRole?: string | null; expectedUsers?: number | null }
    roleInAccount: MemberRole
    status: MemberStatus
    onboardingCompleted: boolean
  }
  stats: { members: number; workflows: number }
}
