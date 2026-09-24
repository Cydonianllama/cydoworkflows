import type { TriggerRegistration, TriggerRegistryPort } from "@cydo/workflow-engine"
import mongoose from "mongoose"
import {
  TriggerRegistrationModel,
  type TriggerRegistrationAttrs,
} from "../../modules/workflows/workflows.trigger.model"

function toAttrs(workflowId: mongoose.Types.ObjectId, reg: TriggerRegistration): TriggerRegistrationAttrs {
  return {
    workflowId,
    ownerId: new mongoose.Types.ObjectId(reg.ownerId),
    version: reg.version,
    nodeId: reg.nodeId,
    nodeType: reg.nodeType,
    kind: reg.kind,
    cron: reg.kind === "cron" ? reg.cron : null,
    timezone: reg.kind === "cron" ? reg.timezone : null,
    nextRunAt: reg.kind === "cron" ? reg.nextRunAt : null,
    webhookToken: reg.kind === "webhook" ? reg.webhookToken : null,
  }
}

export class MongoTriggerRegistryAdapter implements TriggerRegistryPort {
  async replaceForWorkflow(workflowId: string, registrations: TriggerRegistration[]): Promise<void> {
    const workflowObjectId = new mongoose.Types.ObjectId(workflowId)
    await TriggerRegistrationModel.deleteMany({ workflowId: workflowObjectId })
    if (registrations.length === 0) return
    await TriggerRegistrationModel.insertMany(
      registrations.map((reg) => toAttrs(workflowObjectId, reg)),
    )
  }

  async removeForWorkflow(workflowId: string): Promise<void> {
    await TriggerRegistrationModel.deleteMany({ workflowId: new mongoose.Types.ObjectId(workflowId) })
  }

  async listCronTriggers(): Promise<TriggerRegistration[]> {
    const docs = await TriggerRegistrationModel.find({ kind: "cron" }).lean()
    return docs.map((doc) => ({
      workflowId: doc.workflowId.toString(),
      ownerId: doc.ownerId.toString(),
      version: doc.version,
      nodeId: doc.nodeId,
      nodeType: doc.nodeType,
      kind: "cron" as const,
      cron: doc.cron ?? "",
      timezone: doc.timezone ?? "UTC",
      nextRunAt: doc.nextRunAt ?? null,
    }))
  }

  async findByWebhookToken(token: string): Promise<TriggerRegistration | null> {
    const doc = await TriggerRegistrationModel.findOne({ kind: "webhook", webhookToken: token }).lean()
    if (!doc) return null
    return {
      workflowId: doc.workflowId.toString(),
      ownerId: doc.ownerId.toString(),
      version: doc.version,
      nodeId: doc.nodeId,
      nodeType: doc.nodeType,
      kind: "webhook" as const,
      webhookToken: doc.webhookToken ?? "",
    }
  }
}
