export type WorkflowStatus = "draft" | "published"

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

/* POST /workflows */
export interface CreateWorkflowRequestDTO {
  name: string
}

export interface CreateWorkflowResponseDTO {
  workflow: WorkflowDTO
}

/* GET /workflows */
export interface ListWorkflowsRequestDTO {
  page: number
  limit: number
  search?: string
}

export interface ListWorkflowsResponseDTO {
  items: WorkflowDTO[]
}

/* DELETE /workflows/:id */
export interface DeleteWorkflowResponseDTO {
  id: string
}

/* GET /workflows/:id */
export interface GetWorkflowResponseDTO {
  workflow: WorkflowDTO
}

/* PATCH /workflows/:id */
export interface UpdateWorkflowRequestDTO {
  name: string
}

export interface UpdateWorkflowResponseDTO {
  workflow: WorkflowDTO
}

/* GET/PUT /workflows/:id/graph */
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

export interface GraphNodeDTO {
  id: string
  title: string
  createdAt: string
  type: GraphNodeType
  configuration?: unknown
  nextNode: string
  position: { x: number; y: number }
}

export interface WorkflowGraphDTO {
  workflowId: string
  nodes: GraphNodeDTO[]
  updatedAt: string
}

export interface GetWorkflowGraphResponseDTO {
  graph: WorkflowGraphDTO
}

export interface SaveWorkflowGraphRequestDTO {
  nodes: GraphNodeDTO[]
}

export interface SaveWorkflowGraphResponseDTO {
  graph: WorkflowGraphDTO
}

/* POST /workflows/:id/publish */
export interface PublishWorkflowResponseDTO {
  workflow: WorkflowDTO
}

/* GET /workflows/:id/versions */
export interface ListWorkflowVersionsRequestDTO {
  page: number
  limit: number
}

export interface WorkflowVersionSummaryDTO {
  workflowId: string
  version: number
  name: string
  nodeCount: number
  publishedAt: string
}

export interface ListWorkflowVersionsResponseDTO {
  items: WorkflowVersionSummaryDTO[]
}

/* GET /workflows/:id/versions/:version */
export interface WorkflowVersionDetailDTO extends WorkflowVersionSummaryDTO {
  nodes: GraphNodeDTO[]
}

export interface GetWorkflowVersionResponseDTO {
  version: WorkflowVersionDetailDTO
}

/* POST /workflows/:id/versions/:version/restore · POST /workflows/:id/revert */
export interface RestoreWorkflowResponseDTO {
  graph: WorkflowGraphDTO
  workflow: WorkflowDTO
}
