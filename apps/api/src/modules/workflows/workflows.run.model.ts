import mongoose, { Schema, type Model } from "mongoose"

export type WorkflowRunStatus = "running" | "success" | "failed" | "limit" | "cancelled"
export type WorkflowRunStepStatus = "success" | "error" | "skipped"
export type WorkflowRunTriggerKind = "cron" | "webhook" | "manual"

export interface WorkflowRunStepAttrs {
  nodeId: string
  type: string
  status: WorkflowRunStepStatus
  startedAt: Date
  finishedAt: Date
  output: unknown
  error: string | null
}

export interface WorkflowRunAttrs {
  workflowId: mongoose.Types.ObjectId
  ownerId: mongoose.Types.ObjectId
  version: number
  trigger: { kind: WorkflowRunTriggerKind; nodeId: string }
  status: WorkflowRunStatus
  steps: WorkflowRunStepAttrs[]
  error: string | null
  startedAt: Date
  finishedAt: Date | null
}

const workflowRunStepSchema = new Schema<WorkflowRunStepAttrs>(
  {
    nodeId: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, enum: ["success", "error", "skipped"], required: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    output: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
  },
  { _id: false },
)

const workflowRunSchema = new Schema<WorkflowRunAttrs>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    version: { type: Number, required: true, min: 1 },
    trigger: {
      kind: { type: String, enum: ["cron", "webhook", "manual"], required: true },
      nodeId: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["running", "success", "failed", "limit", "cancelled"],
      default: "running",
    },
    steps: { type: [workflowRunStepSchema], default: [] },
    error: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

workflowRunSchema.index({ workflowId: 1, startedAt: -1 })
workflowRunSchema.index({ ownerId: 1, startedAt: -1 })

export const WorkflowRunModel: Model<WorkflowRunAttrs> =
  (mongoose.models.WorkflowRun as Model<WorkflowRunAttrs> | undefined) ??
  mongoose.model<WorkflowRunAttrs>("WorkflowRun", workflowRunSchema)
