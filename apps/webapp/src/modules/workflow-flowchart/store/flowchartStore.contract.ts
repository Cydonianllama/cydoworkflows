import type { Edge, Node } from "@xyflow/react"
import type { WorkflowStatus } from "@/lib/api/workflows"

export interface FlowchartWorkflowMeta {
  status: WorkflowStatus
  version: number
  publishedAt: string | null
  hasUnpublishedChanges: boolean
}

export interface FlowchartModuleState {
  workflowId: string
  workflowName: string
  nodes: Node[]
  edges: Edge[]
  loading: boolean
  dirty: boolean
  status: WorkflowStatus
  version: number
  publishedAt: string | null
  hasUnpublishedChanges: boolean
  publishing: boolean
}

export interface FlowchartModuleActions {
  setWorkflowId(workflowId: string): void
  setWorkflowName(workflowName: string): void
  setWorkflowMeta(meta: FlowchartWorkflowMeta): void
  setPublishing(publishing: boolean): void
  setNodes(nodes: Node[]): void
  setEdges(edges: Edge[]): void
  setLoading(loading: boolean): void
  addNode(node: Node): void
  removeEdge(id: string): void
  markDirty(): void
  markSaved(): void
  reset(): void
}

export type FlowchartModuleStore = FlowchartModuleState & FlowchartModuleActions
