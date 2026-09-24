import mongoose, { Schema, type Model } from "mongoose"

export type TriggerRegistrationKind = "cron" | "webhook" | "manual"

export interface TriggerRegistrationAttrs {
  workflowId: mongoose.Types.ObjectId
  ownerId: mongoose.Types.ObjectId
  version: number
  nodeId: string
  nodeType: string
  kind: TriggerRegistrationKind
  cron: string | null
  timezone: string | null
  nextRunAt: Date | null
  webhookToken: string | null
}

const triggerRegistrationSchema = new Schema<TriggerRegistrationAttrs>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    version: { type: Number, required: true, min: 1 },
    nodeId: { type: String, required: true },
    nodeType: { type: String, required: true },
    kind: { type: String, enum: ["cron", "webhook", "manual"], required: true },
    cron: { type: String, default: null },
    timezone: { type: String, default: null },
    nextRunAt: { type: Date, default: null },
    webhookToken: { type: String, default: null },
  },
  { timestamps: true },
)

triggerRegistrationSchema.index({ workflowId: 1, version: 1 })
triggerRegistrationSchema.index({ ownerId: 1 })
triggerRegistrationSchema.index({ kind: 1, nextRunAt: 1 })
triggerRegistrationSchema.index(
  { webhookToken: 1 },
  { unique: true, partialFilterExpression: { webhookToken: { $type: "string" } } },
)

export const TriggerRegistrationModel: Model<TriggerRegistrationAttrs> =
  (mongoose.models.TriggerRegistration as Model<TriggerRegistrationAttrs> | undefined) ??
  mongoose.model<TriggerRegistrationAttrs>("TriggerRegistration", triggerRegistrationSchema)
