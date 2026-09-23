import { Mail, Users } from "lucide-react"
import { useAuth } from "@cydo/auth/client"
import { EmptyState } from "@/components/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useConfirm } from "@/features/confirm/ConfirmProvider"
import type { MemberDTO } from "@/lib/api/members"
import { formatDate } from "@/utils/format"
import { canManageRoles, canRemoveMembers } from "@/utils/permissions"
import { useSettingsActions } from "../actions/useSettingsActions"
import { INVITE_ROLE_LABEL, INVITE_ROLE_OPTIONS } from "../catalog/settingsCatalog"
import { MemberRow } from "../components/MemberRow/MemberRow"
import { useSettingsInitialLoad } from "../hooks/useSettingsInitialLoad"

export function SettingsMembersComposition() {
  const { user } = useAuth()
  const {
    members,
    invites,
    loading,
    pendingMemberId,
    changeMemberRoleAction,
    restrictMemberAction,
    removeMemberAction,
  } = useSettingsActions()
  const confirm = useConfirm()

  useSettingsInitialLoad()

  const roleOptions = INVITE_ROLE_OPTIONS.map((option) => ({
    value: option.value as "admin" | "member",
    label: option.label,
  }))

  const handleRemove = async (member: MemberDTO) => {
    const accepted = await confirm({
      title: `¿Eliminar a ${member.name}?`,
      description: "Perderá acceso a la cuenta y a sus workflows.",
      confirmLabel: "Eliminar",
      destructive: true,
    })
    if (!accepted) return
    await removeMemberAction(member.id)
  }

  if (loading && members.length === 0) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    )
  }

  if (members.length === 0) {
    return <EmptyState icon={<Users className="h-6 w-6" />} title="Todavía no hay miembros" description="Invita a tu equipo para colaborar." />
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Miembro</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                currentUserId={user?.id}
                pending={pendingMemberId === member.id}
                canManageRole={canManageRoles(user)}
                canRestrict={canManageRoles(user)}
                canRemove={canRemoveMembers(user)}
                roleOptions={roleOptions}
                onRoleChange={(target, role) => void changeMemberRoleAction(target.id, role)}
                onToggleRestricted={(target, restricted) => void restrictMemberAction(target.id, restricted)}
                onRemove={(target) => void handleRemove(target)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {invites.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Invitaciones pendientes</h2>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{invite.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{INVITE_ROLE_LABEL[invite.roleInAccount]}</Badge>
                  <span className="text-xs text-muted-foreground">Expira {formatDate(invite.expiresAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
