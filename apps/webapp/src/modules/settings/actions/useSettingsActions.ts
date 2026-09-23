import { useCallback } from "react"
import { toast } from "sonner"
import {
  inviteMemberRequest,
  listMembersRequest,
  removeMemberRequest,
  restrictMemberRequest,
  updateMemberRoleRequest,
} from "@/lib/api/members"
import type { InviteRole } from "@/lib/api/members"
import { eventBus } from "@/lib/eventBus/eventBus"
import { errorMessage } from "@/utils/error"
import { useSettingsStore } from "../store"

export const useSettingsActions = () => {
  const {
    members,
    invites,
    loading,
    inviting,
    pendingMemberId,
    setMembers,
    setInvites,
    setLoading,
    setInviting,
    setPendingMemberId,
    replaceMember,
    removeMemberLocal,
  } = useSettingsStore()

  const fetchMembersAction = useCallback(async () => {
    try {
      setLoading(true)

      const req = await listMembersRequest()

      if (!req) {
        toast.error("Error al cargar los miembros")
        return
      }

      if (!req.status) {
        toast.error(req.message ?? "Error al cargar los miembros")
        return
      }

      if (!req.data?.members) {
        toast.error("Respuesta inesperada del servidor")
        return
      }

      setMembers(req.data.members)
      setInvites(req.data.invites ?? [])
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (ListMembersAction)"))
    } finally {
      setLoading(false)
    }
  }, [setInvites, setLoading, setMembers])

  const inviteMemberAction = useCallback(
    async (email: string, role: InviteRole) => {
      try {
        setInviting(true)

        const req = await inviteMemberRequest({ email, role })

        if (!req) {
          toast.error("No pudimos enviar la invitación")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "No pudimos enviar la invitación")
          return false
        }

        if (!req.data?.invite) {
          toast.error("Respuesta inesperada del servidor")
          return false
        }

        setInvites([req.data.invite, ...invites])
        eventBus.emit("member.invited", { email: req.data.invite.email, role: req.data.invite.roleInAccount })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (InviteMemberAction)"))
        return false
      } finally {
        setInviting(false)
      }
    },
    [invites, setInviting, setInvites],
  )

  const changeMemberRoleAction = useCallback(
    async (memberId: string, role: InviteRole) => {
      try {
        setPendingMemberId(memberId)

        const req = await updateMemberRoleRequest(memberId, { role })

        if (!req) {
          toast.error("No pudimos cambiar el rol")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "No pudimos cambiar el rol")
          return false
        }

        if (!req.data?.member) {
          toast.error("Respuesta inesperada del servidor")
          return false
        }

        replaceMember(req.data.member)
        eventBus.emit("member.role.changed", { memberId, role })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (ChangeMemberRoleAction)"))
        return false
      } finally {
        setPendingMemberId(null)
      }
    },
    [replaceMember, setPendingMemberId],
  )

  const restrictMemberAction = useCallback(
    async (memberId: string, restricted: boolean) => {
      try {
        setPendingMemberId(memberId)

        const req = await restrictMemberRequest(memberId, { restricted })

        if (!req) {
          toast.error("No pudimos actualizar la restricción")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "No pudimos actualizar la restricción")
          return false
        }

        if (!req.data?.member) {
          toast.error("Respuesta inesperada del servidor")
          return false
        }

        replaceMember(req.data.member)
        eventBus.emit("member.restricted", { memberId, restricted })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (RestrictMemberAction)"))
        return false
      } finally {
        setPendingMemberId(null)
      }
    },
    [replaceMember, setPendingMemberId],
  )

  const removeMemberAction = useCallback(
    async (memberId: string) => {
      try {
        setPendingMemberId(memberId)

        const req = await removeMemberRequest(memberId)

        if (!req) {
          toast.error("No pudimos eliminar al miembro")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "No pudimos eliminar al miembro")
          return false
        }

        if (!req.data?.id) {
          toast.error("Respuesta inesperada del servidor")
          return false
        }

        removeMemberLocal(req.data.id)
        eventBus.emit("member.removed", { memberId: req.data.id })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (RemoveMemberAction)"))
        return false
      } finally {
        setPendingMemberId(null)
      }
    },
    [removeMemberLocal, setPendingMemberId],
  )

  return {
    fetchMembersAction,
    inviteMemberAction,
    changeMemberRoleAction,
    restrictMemberAction,
    removeMemberAction,
    members,
    invites,
    loading,
    inviting,
    pendingMemberId,
  }
}
