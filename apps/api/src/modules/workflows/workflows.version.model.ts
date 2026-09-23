import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose"
import type { GraphNodeAttrs } from "./workflows.graph.model"

export interface WorkflowVersionAttrs {
  workflowId: mongoose.Types.ObjectId
  ownerId: mongoose.Types.ObjectId
  version: number
  name: string
  nodes: unknown[]
  nodeCount: number
  publishedBy: mongoose.Types.ObjectId
  publishedAt: Date
}

const workflowVersionSchema = new Schema<WorkflowVersionAttrs>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    version: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    nodeCount: { type: Number, required: true, min: 0 },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, required: true },
  },
  { timestamps: true },
)

workflowVersionSchema.index({ workflowId: 1, version: 1 }, { unique: true })
workflowVersionSchema.index({ ownerId: 1, workflowId: 1 })

export const WorkflowVersionModel: Model<WorkflowVersionAttrs> =
  (mongoose.models.WorkflowVersion as Model<WorkflowVersionAttrs> | undefined) ??
  mongoose.model<WorkflowVersionAttrs>("WorkflowVersion", workflowVersionSchema)

export interface WorkflowVersionSummaryDTO {
  workflowId: string
  version: number
  name: string
  nodeCount: number
  publishedAt: string
}

export interface WorkflowVersionDTO extends WorkflowVersionSummaryDTO {
  nodes: GraphNodeAttrs[]
}

export function toWorkflowVersionSummaryDTO(
  doc: HydratedDocument<WorkflowVersionAttrs>,
): WorkflowVersionSummaryDTO {
  return {
    workflowId: doc.workflowId.toString(),
    version: doc.version,
    name: doc.name,
    nodeCount: doc.nodeCount,
    publishedAt: doc.publishedAt.toISOString(),
  }
}

export function toWorkflowVersionDTO(
  doc: HydratedDocument<WorkflowVersionAttrs>,
): WorkflowVersionDTO {
  return {
    ...toWorkflowVersionSummaryDTO(doc),
    nodes: (doc.nodes as GraphNodeAttrs[]).map((node) => ({
      id: node.id,
      title: node.title,
      createdAt: node.createdAt,
      type: node.type,
      configuration: node.configuration,
      nextNode: node.nextNode,
      position: { x: node.position.x, y: node.position.y },
    })),
  }
}
