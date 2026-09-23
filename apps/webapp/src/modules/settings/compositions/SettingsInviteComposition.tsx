import { UserPlus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSettingsActions } from "../actions/useSettingsActions"
import { INVITE_ROLE_OPTIONS } from "../catalog/settingsCatalog"
import { InviteMemberDialog } from "../components/InviteMemberDialog/InviteMemberDialog"

export interface SettingsInviteCompositionProps {
  canInvite: boolean
}

export function SettingsInviteComposition({ canInvite }: SettingsInviteCompositionProps) {
  const { inviteMemberAction, inviting } = useSettingsActions()
  const [open, setOpen] = useState(false)

  if (!canInvite) return null

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Invitar miembro
      </Button>

      <InviteMemberDialog
        open={open}
        loading={inviting}
        roleOptions={INVITE_ROLE_OPTIONS}
        onOpenChange={setOpen}
        onSubmit={async (email, role) => {
          const ok = await inviteMemberAction(email, role)
          if (ok) setOpen(false)
        }}
      />
    </>
  )
}
