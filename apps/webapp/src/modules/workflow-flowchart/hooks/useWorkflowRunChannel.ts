import { useCallback, useEffect, useRef, useState } from "react"
import { eventBus } from "@/lib/eventBus/eventBus"
import {
  connectSocket,
  disconnectSocket,
  socket,
  subscribeWorkflow,
  unsubscribeWorkflow,
  type NodeFinishedEvent,
  type NodeStartedEvent,
  type RunFinishedEvent,
} from "@/setup/socketSetup"
import type { NodeExecutionStatus } from "../nodes/types"

export interface FlowExecutionState {
  running: boolean
  activeNodeId: string | null
  runId: string | null
  /** Pasos ya finalizados del run activo, con su input/output. */
  steps: NodeFinishedEvent[]
  /** Estado persistente por nodo tras ejecutarse (hasta cambiar su configuración). */
  executedNodes: Record<string, NodeExecutionStatus>
}

export interface FlowExecutionApi extends FlowExecutionState {
  /** Empieza a seguir por socket.io el run recién lanzado. */
  track(runId: string): void
  /** Deja de seguir el run (la ejecución del servidor continúa). */
  stop(): void
  /** Limpia el estado "ejecutado" de los nodos indicados (p.ej. al cambiar su config). */
  clearExecuted(nodeIds: string[]): void
}

type ChannelEvent =
  | { kind: "nodeStarted"; payload: NodeStartedEvent }
  | { kind: "nodeFinished"; payload: NodeFinishedEvent }
  | { kind: "runFinished"; payload: RunFinishedEvent }

const MAX_BUFFERED_EVENTS = 500

function idleState(): FlowExecutionState {
  return { running: false, activeNodeId: null, runId: null, steps: [], executedNodes: {} }
}

function pushBounded(list: ChannelEvent[] | undefined, event: ChannelEvent): ChannelEvent[] {
  const next = list ? [...list, event] : [event]
  return next.length > MAX_BUFFERED_EVENTS ? next.slice(next.length - MAX_BUFFERED_EVENTS) : next
}

/**
 * Canal en tiempo real del editor: al montarse conecta socket.io y se
 * suscribe a la room del workflow. Los eventos del run (`node:started`,
 * `node:completed`, `node:failed`, `run:finished`) alimentan el resaltado del
 * canvas, los pasos con su output y el estado persistente "ejecutado" por nodo.
 *
 * Los eventos que llegan antes de conocer el `runId` (un run puede terminar
 * antes de que responda el POST) se bufferizan y se aplican al hacer `track`.
 */
export function useWorkflowRunChannel(workflowId: string): FlowExecutionApi {
  const [state, setState] = useState<FlowExecutionState>(idleState)
  const runIdRef = useRef<string | null>(null)
  const bufferRef = useRef(new Map<string, ChannelEvent[]>())

  const dispatch = useCallback((event: ChannelEvent) => {
    if (event.kind === "nodeStarted") {
      const { nodeId, runId } = event.payload
      setState((prev) => ({ ...prev, running: true, activeNodeId: nodeId, runId }))
      return
    }

    if (event.kind === "nodeFinished") {
      const step = event.payload
      const status: NodeExecutionStatus = step.status === "error" ? "error" : "success"
      setState((prev) =>
        prev.runId === step.runId
          ? {
              ...prev,
              steps: [...prev.steps, step],
              executedNodes: { ...prev.executedNodes, [step.nodeId]: status },
            }
          : prev,
      )
      return
    }

    runIdRef.current = null
    setState((prev) => ({ ...prev, running: false, activeNodeId: null, runId: null }))
    eventBus.emit("workflow.run.finished", {
      workflowId,
      runId: event.payload.runId,
      status: event.payload.status,
    })
  }, [workflowId])

  useEffect(() => {
    if (!workflowId) return

    connectSocket()
    subscribeWorkflow(workflowId)

    const buffer = bufferRef.current
    const route = (runId: string, event: ChannelEvent) => {
      if (runId === runIdRef.current) {
        dispatch(event)
        return
      }
      buffer.set(runId, pushBounded(buffer.get(runId), event))
    }

    const handleNodeStarted = (payload: NodeStartedEvent) =>
      route(payload.runId, { kind: "nodeStarted", payload })
    const handleNodeCompleted = (payload: NodeFinishedEvent) =>
      route(payload.runId, { kind: "nodeFinished", payload })
    const handleNodeFailed = (payload: NodeFinishedEvent) =>
      route(payload.runId, { kind: "nodeFinished", payload })
    const handleRunFinished = (payload: RunFinishedEvent) =>
      route(payload.runId, { kind: "runFinished", payload })

    socket.on("node:started", handleNodeStarted)
    socket.on("node:completed", handleNodeCompleted)
    socket.on("node:failed", handleNodeFailed)
    socket.on("run:finished", handleRunFinished)

    return () => {
      socket.off("node:started", handleNodeStarted)
      socket.off("node:completed", handleNodeCompleted)
      socket.off("node:failed", handleNodeFailed)
      socket.off("run:finished", handleRunFinished)
      unsubscribeWorkflow(workflowId)
      disconnectSocket()
      buffer.clear()
    }
  }, [workflowId, dispatch])

  const track = useCallback(
    (runId: string) => {
      runIdRef.current = runId
      setState({ running: true, activeNodeId: null, runId, steps: [], executedNodes: {} })

      const buffered = bufferRef.current.get(runId)
      bufferRef.current.clear()
      if (buffered) {
        for (const event of buffered) dispatch(event)
      }
    },
    [dispatch],
  )

  const stop = useCallback(() => {
    runIdRef.current = null
    setState((prev) => ({ ...prev, running: false, activeNodeId: null, runId: null }))
  }, [])

  const clearExecuted = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return
    const ids = new Set(nodeIds)
    setState((prev) => {
      const executedNodes = { ...prev.executedNodes }
      for (const id of ids) delete executedNodes[id]
      const steps = prev.steps.filter((step) => !ids.has(step.nodeId))
      return { ...prev, executedNodes, steps }
    })
  }, [])

  return { ...state, track, stop, clearExecuted }
}
