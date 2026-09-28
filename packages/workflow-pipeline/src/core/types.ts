export type RunStatus = "success" | "failed" | "limit" | "cancelled"

export type TriggerKind = "cron" | "webhook" | "manual"

/**
 * Un item de datos al estilo n8n: el payload JSON y, opcionalmente,
 * referencias a binarios. Todo lo que fluye entre nodos son items.
 */
export interface RunItem {
  json: Record<string, unknown>
  binary?: Record<string, unknown>
}

export type RunItems = RunItem[]

/** Salidas acumuladas por nodo dentro de una ejecución (el `runData` de n8n). */
export type RunData = Record<string, RunItems>

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
  /** Items con los que arranca la ejecución (seed del nodo de entrada). */
  inputData: RunItems
}

export interface PipelineInput {
  nodes: PipelineNode[]
  startNodeId: string
  context: RunContext
}

export interface NodeExecutionResult {
  nextNodeIds?: string[]
  output?: RunItems
}

export interface NodeExecutionContext {
  context: RunContext
  /** Items que llegan de los nodos anteriores (o `inputData` en el nodo inicial). */
  input: RunItems
  /** Salidas acumuladas por nodo, mutables durante el run. */
  runData: RunData
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
  input: RunItems
  output: RunItems
  error: string | null
}

export interface RunResult {
  status: RunStatus
  steps: RunStep[]
  error: string | null
  startedAt: Date
  finishedAt: Date
  runData: RunData
}

export interface RunnerOptions {
  maxSteps: number
}

export const DEFAULT_RUNNER_OPTIONS: RunnerOptions = {
  maxSteps: 50,
}
