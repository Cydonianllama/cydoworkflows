import type { RunData, RunItem, RunItems } from "@cydo/workflow-pipeline"
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose"

export type WorkflowRunStatus = "running" | "success" | "failed" | "limit" | "cancelled"
export type WorkflowRunStepStatus = "success" | "error" | "skipped"
export type WorkflowRunTriggerKind = "cron" | "webhook" | "manual"

export interface WorkflowRunStepAttrs {
  nodeId: string
  type: string
  status: WorkflowRunStepStatus
  startedAt: Date
  finishedAt: Date
  input: RunItems
  output: RunItems
  error: string | null
}

export interface WorkflowRunAttrs {
  workflowId: mongoose.Types.ObjectId
  ownerId: mongoose.Types.ObjectId
  version: number
  trigger: { kind: WorkflowRunTriggerKind; nodeId: string }
  status: WorkflowRunStatus
  /** Items con los que arranca la ejecución (el "input data" del run). */
  inputData: RunItem[]
  steps: WorkflowRunStepAttrs[]
  /** Salidas acumuladas por nodo al terminar (el `runData` de n8n). */
  data: RunData
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
    input: { type: Schema.Types.Mixed, default: [] },
    output: { type: Schema.Types.Mixed, default: [] },
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
    inputData: { type: Schema.Types.Mixed, default: [] },
    steps: { type: [workflowRunStepSchema], default: [] },
    data: { type: Schema.Types.Mixed, default: {} },
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

export interface WorkflowRunStepDTO {
  nodeId: string
  type: string
  status: WorkflowRunStepStatus
  startedAt: string
  finishedAt: string
  input: RunItems
  output: RunItems
  error: string | null
}

export interface WorkflowRunSummaryDTO {
  id: string
  workflowId: string
  version: number
  trigger: { kind: WorkflowRunTriggerKind; nodeId: string }
  status: WorkflowRunStatus
  inputData: RunItems
  stepCount: number
  error: string | null
  startedAt: string
  finishedAt: string | null
}

export interface WorkflowRunDetailDTO extends WorkflowRunSummaryDTO {
  steps: WorkflowRunStepDTO[]
  data: RunData
}

function toStepDTO(step: WorkflowRunStepAttrs): WorkflowRunStepDTO {
  return {
    nodeId: step.nodeId,
    type: step.type,
    status: step.status,
    startedAt: new Date(step.startedAt).toISOString(),
    finishedAt: new Date(step.finishedAt).toISOString(),
    input: step.input ?? [],
    output: step.output ?? [],
    error: step.error,
  }
}

export function toWorkflowRunSummaryDTO(
  doc: HydratedDocument<WorkflowRunAttrs>,
): WorkflowRunSummaryDTO {
  return {
    id: doc._id.toString(),
    workflowId: doc.workflowId.toString(),
    version: doc.version,
    trigger: doc.trigger,
    status: doc.status,
    inputData: doc.inputData ?? [],
    stepCount: doc.steps?.length ?? 0,
    error: doc.error,
    startedAt: new Date(doc.startedAt).toISOString(),
    finishedAt: doc.finishedAt ? new Date(doc.finishedAt).toISOString() : null,
  }
}

export function toWorkflowRunDetailDTO(
  doc: HydratedDocument<WorkflowRunAttrs>,
): WorkflowRunDetailDTO {
  return {
    ...toWorkflowRunSummaryDTO(doc),
    steps: (doc.steps ?? []).map(toStepDTO),
    data: doc.data ?? {},
  }
}

