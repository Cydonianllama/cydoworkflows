export type RunStatus = "success" | "failed" | "limit" | "cancelled"

export type TriggerKind = "cron" | "webhook" | "manual"

export interface PipelineNode {
  id: string
  type: string
  configuration?: unknown
  nextNode: string
}

export interface RunTrigger {
  kind: TriggerKind
  nodeId: string
  payload?: unknown
}

export interface RunContext {
  workflowId: string
  version: number
  trigger: RunTrigger
  variables: Record<string, unknown>
}

export interface PipelineInput {
  nodes: PipelineNode[]
  startNodeId: string
  context: RunContext
}

export interface NodeExecutionResult {
  nextNodeIds?: string[]
  output?: unknown
}

export interface NodeExecutionContext {
  context: RunContext
  signal: AbortSignal
}

export type NodeExecutor = (
  node: PipelineNode,
  execution: NodeExecutionContext,
) => Promise<NodeExecutionResult | void> | NodeExecutionResult | void

export type NodeExecutorRegistry = Record<string, NodeExecutor | undefined>

export type RunStepStatus = "success" | "error" | "skipped"

export interface RunStep {
  nodeId: string
  type: string
  status: RunStepStatus
  startedAt: Date
  finishedAt: Date
  output: unknown
  error: string | null
}

export interface RunResult {
  status: RunStatus
  steps: RunStep[]
  error: string | null
  startedAt: Date
  finishedAt: Date
}

export interface RunnerOptions {
  maxSteps: number
}

export const DEFAULT_RUNNER_OPTIONS: RunnerOptions = {
  maxSteps: 50,
}
