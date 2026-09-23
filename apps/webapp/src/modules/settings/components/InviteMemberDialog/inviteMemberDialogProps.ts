import type { SelectOption } from "@/modules/onboarding/catalog/onboardingCatalog"

export interface InviteMemberDialogProps {
  open: boolean
  loading?: boolean
  roleOptions: SelectOption[]
  onOpenChange: (open: boolean) => void
  onSubmit: (email: string, role: "admin" | "member") => void | Promise<void>
}
