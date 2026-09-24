import type { RunEvents } from "../core/events"
import { PIPELINE_ERROR } from "../core/errors"
import type {
  NodeExecutorRegistry,
  PipelineInput,
  RunResult,
  RunStatus,
  RunStep,
  RunnerOptions,
} from "../core/types"
import { DEFAULT_RUNNER_OPTIONS } from "../core/types"

/**
 * Recorre el grafo a partir del nodo de entrada usando una cola FIFO
 * con conjunto de visitados (misma semántica que la simulación del front:
 * `useFlowExecution`). Los executors de cada tipo de nodo se inyectan
 * por DI: sin executor registrado el nodo se saltea y se sigue por `nextNode`.
 */
export class PipelineRunner {
  private readonly registry: NodeExecutorRegistry
  private readonly options: RunnerOptions

  constructor(registry: NodeExecutorRegistry = {}, options: Partial<RunnerOptions> = {}) {
    this.registry = registry
    this.options = { ...DEFAULT_RUNNER_OPTIONS, ...options }
  }

  async run(
    input: PipelineInput,
    events: RunEvents = {},
    signal?: AbortSignal,
  ): Promise<RunResult> {
    const abortSignal = signal ?? new AbortController().signal
    const startedAt = new Date()
    await events.onRunStart?.({ startedAt })

    const nodeById = new Map(input.nodes.map((node) => [node.id, node]))
    const visited = new Set<string>()
    const queue: string[] = [input.startNodeId]
    const steps: RunStep[] = []

    let status: RunStatus = "success"
    let error: string | null = null

    if (!nodeById.has(input.startNodeId)) {
      status = "failed"
      error = `${PIPELINE_ERROR.NODE_NOT_FOUND}: ${input.startNodeId}`
    }

    while (queue.length > 0 && status === "success") {
      if (abortSignal.aborted) {
        status = "cancelled"
        error = `${PIPELINE_ERROR.RUN_CANCELLED}`
        break
      }

      const nodeId = queue.shift()
      if (!nodeId || visited.has(nodeId)) continue

      const node = nodeById.get(nodeId)
      if (!node) continue

      if (steps.length >= this.options.maxSteps) {
        status = "limit"
        error = `${PIPELINE_ERROR.RUN_LIMIT_REACHED}: ${this.options.maxSteps}`
        break
      }

      visited.add(nodeId)
      const stepStartedAt = new Date()
      await events.onNodeStart?.({ nodeId, type: node.type, startedAt: stepStartedAt })

      let stepError: string | null = null
      let stepOutput: unknown = null
      try {
        const executor = this.registry[node.type]
        const result = await executor?.(node, {
          context: input.context,
          signal: abortSignal,
        })
        stepOutput = result?.output ?? null
        const nextNodeIds = result?.nextNodeIds ?? (node.nextNode ? [node.nextNode] : [])
        for (const nextId of nextNodeIds) {
          if (!visited.has(nextId)) queue.push(nextId)
        }
      } catch (executionError) {
        stepError =
          executionError instanceof Error
            ? executionError.message
            : `${PIPELINE_ERROR.NODE_EXECUTION_FAILED}: ${String(executionError)}`
      }

      const step: RunStep = {
        nodeId,
        type: node.type,
        status: stepError ? "error" : "success",
        startedAt: stepStartedAt,
        finishedAt: new Date(),
        output: stepOutput,
        error: stepError,
      }

      if (stepError) {
        steps.push(step)
        await events.onNodeError?.(step)
        status = "failed"
        error = stepError
        break
      }

      steps.push(step)
      await events.onNodeComplete?.(step)
    }

    const result: RunResult = {
      status,
      steps,
      error,
      startedAt,
      finishedAt: new Date(),
    }
    await events.onRunFinish?.(result)
    return result
  }
}
