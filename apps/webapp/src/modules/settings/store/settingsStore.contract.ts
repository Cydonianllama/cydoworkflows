import type { InviteDTO, MemberDTO } from "@/lib/api/members"

export interface SettingsModuleState {
  members: MemberDTO[]
  invites: InviteDTO[]
  loading: boolean
  inviting: boolean
  pendingMemberId: string | null
}

export interface SettingsModuleActions {
  setMembers(members: MemberDTO[]): void
  setInvites(invites: InviteDTO[]): void
  setLoading(loading: boolean): void
  setInviting(inviting: boolean): void
  setPendingMemberId(id: string | null): void
  replaceMember(member: MemberDTO): void
  removeMemberLocal(id: string): void
  reset(): void
}

export type SettingsModuleStore = SettingsModuleState & SettingsModuleActions
