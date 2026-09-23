import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose"

export type GraphNodeType =
  | "node:trigger"
  | "node:agent"
  | "node:whatsapp"
  | "node:triggerwebhook"
  | "node:openai"
  | "node:deepseek"
  | "node:callapi"
  | "node:cydoflow"
  | "node:switch"
  | "node:note"
  | "node:redis"
  | "node:scheduletrigger"
  | "node:code"
  | "node:humanapproval"
  | "node:gmail"
  | "node:sheets"
  | "node:supabase"
  | "node:calendar"
  | "node:notion"
  | "node:triggeronclick"
  | "node:wait"
  | "node:editfield"
  | "node:if"
  | "node:telegram"
  | "node:postgres"
  | "node:mongo"
  | "node:airtable"

export interface GraphNodeAttrs {
  id: string
  title: string
  createdAt: string
  type: GraphNodeType
  configuration: unknown
  nextNode: string
  position: { x: number; y: number }
}

export interface WorkflowGraphAttrs {
  workflowId: mongoose.Types.ObjectId
  ownerId: mongoose.Types.ObjectId
  nodes: GraphNodeAttrs[]
  createdAt: Date
  updatedAt: Date
}

const graphNodeSchema = new Schema<GraphNodeAttrs>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    createdAt: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "node:trigger",
        "node:agent",
        "node:whatsapp",
        "node:triggerwebhook",
        "node:openai",
        "node:deepseek",
        "node:callapi",
        "node:cydoflow",
        "node:switch",
        "node:note",
        "node:redis",
        "node:scheduletrigger",
        "node:code",
        "node:humanapproval",
        "node:gmail",
        "node:sheets",
        "node:supabase",
        "node:calendar",
        "node:notion",
        "node:triggeronclick",
        "node:wait",
        "node:editfield",
        "node:if",
        "node:telegram",
        "node:postgres",
        "node:mongo",
        "node:airtable",
      ],
      required: true,
    },
    configuration: { type: Schema.Types.Mixed, default: {} },
    nextNode: { type: String, default: "" },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
  },
  { _id: false },
)

const workflowGraphSchema = new Schema<WorkflowGraphAttrs>(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    nodes: { type: [graphNodeSchema], default: [] },
  },
  { timestamps: true },
)

workflowGraphSchema.index({ ownerId: 1 })

export const WorkflowGraphModel: Model<WorkflowGraphAttrs> =
  (mongoose.models.WorkflowGraph as Model<WorkflowGraphAttrs> | undefined) ??
  mongoose.model<WorkflowGraphAttrs>("WorkflowGraph", workflowGraphSchema)

export interface WorkflowGraphDTO {
  workflowId: string
  nodes: GraphNodeAttrs[]
  updatedAt: string
}

export function toWorkflowGraphDTO(doc: HydratedDocument<WorkflowGraphAttrs>): WorkflowGraphDTO {
  return {
    workflowId: doc.workflowId.toString(),
    nodes: doc.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      createdAt: node.createdAt,
      type: node.type,
      configuration: node.configuration,
      nextNode: node.nextNode,
      position: { x: node.position.x, y: node.position.y },
    })),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
