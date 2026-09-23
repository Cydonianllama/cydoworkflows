import { Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SelectOption } from "../../catalog/onboardingCatalog"

export interface InviteRow {
  email: string
  role: "admin" | "member"
}

export interface InviteMembersListProps {
  invites: InviteRow[]
  roleOptions: SelectOption[]
  disabled?: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onEmailChange: (index: number, email: string) => void
  onRoleChange: (index: number, role: "admin" | "member") => void
}

export function InviteMembersList({
  invites,
  roleOptions,
  disabled = false,
  onAdd,
  onRemove,
  onEmailChange,
  onRoleChange,
}: InviteMembersListProps) {
  return (
    <div className="space-y-3">
      {invites.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Aún no invitaste a nadie.
        </p>
      ) : null}

      {invites.map((invite, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            className="flex-1"
            type="email"
            placeholder="persona@empresa.com"
            value={invite.email}
            disabled={disabled}
            onChange={(event) => onEmailChange(index, event.target.value)}
          />
          <Select
            value={invite.role}
            disabled={disabled}
            onValueChange={(value) => onRoleChange(index, value as "admin" | "member")}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" disabled={disabled} onClick={() => onRemove(index)} aria-label="Quitar">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" disabled={disabled} onClick={onAdd}>
        <UserPlus className="h-4 w-4" />
        Añadir miembro
      </Button>
    </div>
  )
}
