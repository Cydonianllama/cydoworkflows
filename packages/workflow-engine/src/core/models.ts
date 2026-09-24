export type TriggerKind = "cron" | "webhook" | "manual"

export const TRIGGER_NODE_TYPES = {
  schedule: "node:scheduletrigger",
  webhook: "node:triggerwebhook",
  manual: "node:triggeronclick",
} as const

export type TriggerNodeType = (typeof TRIGGER_NODE_TYPES)[keyof typeof TRIGGER_NODE_TYPES]

export interface ScheduleTriggerConfig {
  cron: string
  timezone: string
}

export interface WebhookTriggerConfig {
  token?: string
}

export interface TriggerNode {
  id: string
  type: string
  configuration?: unknown
}

export interface WorkflowRef {
  workflowId: string
  ownerId: string
  version: number
}

interface TriggerBase {
  workflowId: string
  ownerId: string
  version: number
  nodeId: string
  nodeType: string
}

export interface CronTriggerRegistration extends TriggerBase {
  kind: "cron"
  cron: string
  timezone: string
  nextRunAt: Date | null
}

export interface WebhookTriggerRegistration extends TriggerBase {
  kind: "webhook"
  webhookToken: string
}

export interface ManualTriggerRegistration extends TriggerBase {
  kind: "manual"
}

export type TriggerRegistration =
  | CronTriggerRegistration
  | WebhookTriggerRegistration
  | ManualTriggerRegistration

export function isCronTrigger(reg: TriggerRegistration): reg is CronTriggerRegistration {
  return reg.kind === "cron"
}

export function isWebhookTrigger(reg: TriggerRegistration): reg is WebhookTriggerRegistration {
  return reg.kind === "webhook"
}
