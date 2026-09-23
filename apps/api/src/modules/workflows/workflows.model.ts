import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose"

export type WorkflowStatus = "draft" | "published"

export interface WorkflowAttrs {
  ownerId: mongoose.Types.ObjectId
  name: string
  createdBy: mongoose.Types.ObjectId
  status: WorkflowStatus
  version: number
  publishedAt: Date | null
  hasUnpublishedChanges: boolean
  createdAt: Date
  updatedAt: Date
}

const workflowSchema = new Schema<WorkflowAttrs>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    version: { type: Number, default: 0, min: 0 },
    publishedAt: { type: Date, default: null },
    hasUnpublishedChanges: { type: Boolean, default: false },
  },
  { timestamps: true },
)

workflowSchema.index({ ownerId: 1, name: 1 })
workflowSchema.index({ ownerId: 1, createdAt: -1 })

export const WorkflowModel: Model<WorkflowAttrs> =
  (mongoose.models.Workflow as Model<WorkflowAttrs> | undefined) ??
  mongoose.model<WorkflowAttrs>("Workflow", workflowSchema)

export interface WorkflowDTO {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  status: WorkflowStatus
  version: number
  publishedAt: string | null
  hasUnpublishedChanges: boolean
}

export function toWorkflowDTO(doc: HydratedDocument<WorkflowAttrs>): WorkflowDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    status: doc.status ?? "draft",
    version: doc.version ?? 0,
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    hasUnpublishedChanges: doc.hasUnpublishedChanges ?? false,
  }
}
