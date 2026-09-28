/**
 * Catálogo de eventos del EventBus.
 * Representan HECHOS ocurridos ("workflow.created"), no órdenes a otro módulo.
 */
export interface AppEvents {
  "auth.user.registered": { email: string }
  "auth.user.verified": { userId: string; email: string }
  "auth.session.started": { userId: string; email: string; provider: "local" | "google" }
  "auth.session.ended": { userId: string }

  "onboarding.completed": { jobRole: string; expectedUsers: number; invited: string[] }

  "workflow.created": { workflowId: string; name: string }
  "workflow.deleted": { workflowId: string }
  "workflow.graph.saved": { workflowId: string; nodeCount: number }
  "workflow.published": { workflowId: string; version: number }
  "workflow.run.started": { workflowId: string; runId: string }
  "workflow.run.finished": {
    workflowId: string
    runId: string
    status: "success" | "failed" | "limit" | "cancelled"
  }

  "member.invited": { email: string; role: "admin" | "member" }
  "member.removed": { memberId: string }
  "member.restricted": { memberId: string; restricted: boolean }
  "member.role.changed": { memberId: string; role: "admin" | "member" }
}

export type AppEventName = keyof AppEvents
export type AppEventPayload<K extends AppEventName> = AppEvents[K]
