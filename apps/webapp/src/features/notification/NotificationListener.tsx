import { toast } from "sonner"
import { useEvent } from "@/lib/eventBus/useEvent"

/**
 * Escucha hechos publicados por otros módulos y los convierte en notificaciones.
 * No conoce a los emisores: sólo reacciona al EventBus.
 */
export function NotificationListener() {
  useEvent("workflow.created", ({ name }) => toast.success(`Workflow "${name}" creado`))
  useEvent("workflow.deleted", () => toast.success("Workflow eliminado"))
  useEvent("member.invited", ({ email }) => toast.success(`Invitación enviada a ${email}`))
  useEvent("member.removed", () => toast.info("Miembro eliminado"))
  useEvent("member.restricted", ({ restricted }) =>
    toast.info(restricted ? "Miembro restringido" : "Restricción removida"),
  )
  useEvent("member.role.changed", ({ role }) => toast.info(`Rol actualizado a ${role}`))
  useEvent("onboarding.completed", () => toast.success("¡Bienvenido a Cydo!"))
  useEvent("auth.session.started", ({ email }) => toast.success(`Sesión iniciada como ${email}`))

  return null
}
