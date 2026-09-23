import type { InviteRole, MemberRole } from "@/lib/api/members"
import type { SelectOption } from "@/modules/onboarding/catalog/onboardingCatalog"

export const INVITE_ROLE_OPTIONS: SelectOption[] = [
  { value: "member", label: "Miembro" },
  { value: "admin", label: "Administrador" },
]

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Dueño",
  admin: "Administrador",
  member: "Miembro",
}

export const INVITE_ROLE_LABEL: Record<InviteRole, string> = {
  admin: "Administrador",
  member: "Miembro",
}
