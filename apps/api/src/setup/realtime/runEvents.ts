import type { RunEvents, RunResult, RunStep } from "@cydo/workflow-pipeline"
import { emitToWorkflow, type RealtimeNodeFinished } from "./socketServer"

function toISO(value: Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function toNodePayload(runId: string, step: RunStep): RealtimeNodeFinished {
  return {
    runId,
    nodeId: step.nodeId,
    type: step.type,
    status: step.status,
    startedAt: toISO(step.startedAt),
    finishedAt: toISO(step.finishedAt),
    input: step.input,
    output: step.output,
    error: step.error,
  }
}

/**
 * Sink de `RunEvents` que reenvía el avance del pipeline por socket.io
 * a la room del workflow. El paquete del pipeline no conoce socket.io.
 */
export function createRealtimeRunEvents(runId: string, workflowId: string): RunEvents {
  return {
    onRunStart: ({ startedAt }) => {
      emitToWorkflow(workflowId, "run:started", { runId, workflowId, startedAt: toISO(startedAt) })
    },
    onNodeStart: ({ nodeId, type, startedAt }) => {
      emitToWorkflow(workflowId, "node:started", {
        runId,
        nodeId,
        type,
        startedAt: toISO(startedAt),
      })
    },
    onNodeComplete: (step) => {
      emitToWorkflow(workflowId, "node:completed", toNodePayload(runId, step))
    },
    onNodeError: (step) => {
      emitToWorkflow(workflowId, "node:failed", toNodePayload(runId, step))
    },
    onRunFinish: (result: RunResult) => {
      emitToWorkflow(workflowId, "run:finished", {
        runId,
        workflowId,
        status: result.status,
        error: result.error,
        startedAt: toISO(result.startedAt),
        finishedAt: toISO(result.finishedAt),
        runData: result.runData,
      })
    },
  }
}

/** Combina varios sinks de eventos para que un mismo run persista y emita. */
export function mergeRunEvents(...sinks: RunEvents[]): RunEvents {
  const call = async (run: (sink: RunEvents) => Promise<void> | void): Promise<void> => {
    for (const sink of sinks) await run(sink)
  }

  return {
    onRunStart: (info) => call((sink) => sink.onRunStart?.(info)),
    onNodeStart: (step) => call((sink) => sink.onNodeStart?.(step)),
    onNodeComplete: (step) => call((sink) => sink.onNodeComplete?.(step)),
    onNodeError: (step) => call((sink) => sink.onNodeError?.(step)),
    onRunFinish: (result) => call((sink) => sink.onRunFinish?.(result)),
  }
}
