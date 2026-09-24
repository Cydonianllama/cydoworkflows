import type { EnginePorts } from "../core/contracts/ports"
import { ENGINE_ERROR, EngineError } from "../core/errors"
import type {
  CronTriggerRegistration,
  ManualTriggerRegistration,
  TriggerNode,
  TriggerRegistration,
  WebhookTriggerRegistration,
  WorkflowRef,
} from "../core/models"
import { TRIGGER_NODE_TYPES } from "../core/models"
import { scheduleTriggerConfigSchema, triggerWebhookConfigSchema } from "../core/validation"
import { isValidCron, isValidTimezone, nextCronRun } from "./cron"

export interface EngineConfig {
  webhookTokenBytes: number
}

const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  webhookTokenBytes: 16,
}

export class WorkflowTriggerEngine {
  private readonly ports: EnginePorts
  private readonly config: EngineConfig

  constructor(ports: EnginePorts, config: Partial<EngineConfig> = {}) {
    this.ports = ports
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config }
  }

  validateNode(node: TriggerNode): EngineError | null {
    try {
      this.toRegistration({ workflowId: "", ownerId: "", version: 0 }, node)
      return null
    } catch (error) {
      return EngineError.is(error) ? error : new EngineError(ENGINE_ERROR.INVALID_TRIGGER_CONFIG)
    }
  }

  extractTriggers(workflow: WorkflowRef, nodes: TriggerNode[]): TriggerRegistration[] {
    return nodes.map((node) => this.toRegistration(workflow, node)).filter((reg) => reg !== null)
  }

  async syncWorkflowTriggers(
    workflow: WorkflowRef,
    nodes: TriggerNode[],
  ): Promise<TriggerRegistration[]> {
    const registrations = this.extractTriggers(workflow, nodes)
    await this.ports.registry.replaceForWorkflow(workflow.workflowId, registrations)
    return registrations
  }

  async resolveWebhook(token: string): Promise<TriggerRegistration> {
    const registration = await this.ports.registry.findByWebhookToken(token)
    if (!registration) {
      throw new EngineError(ENGINE_ERROR.TRIGGER_NOT_FOUND, `webhook ${token} no registrado`)
    }
    return registration
  }

  async listCronTriggers(): Promise<CronTriggerRegistration[]> {
    const all = await this.ports.registry.listCronTriggers()
    return all.filter((reg): reg is CronTriggerRegistration => reg.kind === "cron")
  }

  async removeTriggers(workflowId: string): Promise<void> {
    await this.ports.registry.removeForWorkflow(workflowId)
  }

  computeNextRun(cron: string, timezone: string): Date | null {
    return nextCronRun(cron, timezone, this.ports.clock.now())
  }

  private toRegistration(
    workflow: WorkflowRef,
    node: TriggerNode,
  ): CronTriggerRegistration | WebhookTriggerRegistration | ManualTriggerRegistration | null {
    if (node.type === TRIGGER_NODE_TYPES.schedule) {
      return this.toCronRegistration(workflow, node)
    }
    if (node.type === TRIGGER_NODE_TYPES.webhook) {
      return this.toWebhookRegistration(workflow, node)
    }
    if (node.type === TRIGGER_NODE_TYPES.manual) {
      return {
        ...workflow,
        nodeId: node.id,
        nodeType: node.type,
        kind: "manual",
      }
    }
    return null
  }

  private toCronRegistration(workflow: WorkflowRef, node: TriggerNode): CronTriggerRegistration {
    const parsed = scheduleTriggerConfigSchema.safeParse(node.configuration ?? {})
    if (!parsed.success) {
      throw new EngineError(
        ENGINE_ERROR.INVALID_TRIGGER_CONFIG,
        `configuración inválida en ${node.id}: ${parsed.error.issues[0]?.message}`,
      )
    }

    const { cron, timezone } = parsed.data
    if (!isValidTimezone(timezone)) {
      throw new EngineError(ENGINE_ERROR.INVALID_TIMEZONE, `timezone inválida: ${timezone}`)
    }
    if (!isValidCron(cron, timezone)) {
      throw new EngineError(ENGINE_ERROR.INVALID_CRON, `cron inválido: ${cron}`)
    }

    return {
      ...workflow,
      nodeId: node.id,
      nodeType: node.type,
      kind: "cron",
      cron,
      timezone,
      nextRunAt: nextCronRun(cron, timezone, this.ports.clock.now()),
    }
  }

  private toWebhookRegistration(
    workflow: WorkflowRef,
    node: TriggerNode,
  ): WebhookTriggerRegistration {
    const parsed = triggerWebhookConfigSchema.safeParse(node.configuration ?? {})
    if (!parsed.success) {
      throw new EngineError(
        ENGINE_ERROR.INVALID_TRIGGER_CONFIG,
        `configuración inválida en ${node.id}: ${parsed.error.issues[0]?.message}`,
      )
    }

    const token = parsed.data.token ?? this.ports.crypto.randomToken(this.config.webhookTokenBytes)
    if (!token) {
      throw new EngineError(ENGINE_ERROR.WEBHOOK_TOKEN_MISSING, `sin token en ${node.id}`)
    }

    return {
      ...workflow,
      nodeId: node.id,
      nodeType: node.type,
      kind: "webhook",
      webhookToken: token,
    }
  }
}
