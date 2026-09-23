import type { InviteRole, MemberDTO } from "@/lib/api/members"

export interface MemberRowProps {
  member: MemberDTO
  currentUserId?: string
  canManageRole: boolean
  canRestrict: boolean
  canRemove: boolean
  pending?: boolean
  roleOptions: Array<{ value: InviteRole; label: string }>
  onRoleChange: (member: MemberDTO, role: InviteRole) => void
  onToggleRestricted: (member: MemberDTO, restricted: boolean) => void
  onRemove: (member: MemberDTO) => void
}
