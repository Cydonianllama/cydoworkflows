import { Loader2, ShieldCheck, ShieldOff, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"
import { initials } from "@/utils/format"
import type { MemberRowProps } from "./memberRowProps"

export function MemberRow({
  member,
  currentUserId,
  canManageRole,
  canRestrict,
  canRemove,
  pending = false,
  roleOptions,
  onRoleChange,
  onToggleRestricted,
  onRemove,
}: MemberRowProps) {
  const isSelf = member.id === currentUserId
  const restricted = member.status === "restricted"

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-semibold">
            {initials(member.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {member.name} {isSelf ? <span className="text-muted-foreground">(tú)</span> : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        {member.isOwner ? (
          <Badge variant="secondary">Dueño</Badge>
        ) : (
          <Select
            value={member.roleInAccount}
            disabled={!canManageRole || pending}
            onValueChange={(value) => onRoleChange(member, value as "admin" | "member")}
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
        )}
      </TableCell>

      <TableCell>
        <Badge variant={restricted ? "warning" : "success"}>{restricted ? "Restringido" : "Activo"}</Badge>
      </TableCell>

      <TableCell className="text-right">
        {member.isOwner ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={!canRestrict || pending}
              aria-label={restricted ? "Quitar restricción" : "Restringir miembro"}
              onClick={() => onToggleRestricted(member, !restricted)}
            >
              {restricted ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canRemove || pending}
              aria-label="Eliminar miembro"
              onClick={() => onRemove(member)}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

export type { MemberRowProps }
