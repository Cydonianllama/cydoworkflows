import { useCallback, useEffect, useRef, useState } from "react"
import type { Node } from "@xyflow/react"
import { getNodeDefinition } from "../nodes"
import type { INode } from "../nodes/types"
import { resolveExecutionConfig } from "../nodes/executionDefaults"
import { getNextExecutionIds } from "../utils/nextExecutionIds"

const MAX_STEPS = 50

function readDomainNode(rfNode: Node | undefined): INode | null {
  if (!rfNode) return null
  const domain = (rfNode.data as { node?: INode } | undefined)?.node
  return domain ?? null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export interface FlowExecutionState {
  running: boolean
  activeNodeId: string | null
}

export interface FlowExecutionApi extends FlowExecutionState {
  start(triggerNodeId: string): Promise<void>
  stop(): void
}

/**
 * Simula el recorrido del flujo a partir de un trigger.
 * La lógica de cada nodo vive en su definición (`onExecute` / `execution`).
 */
export function useFlowExecution(nodes: Node[]): FlowExecutionApi {
  const [state, setState] = useState<FlowExecutionState>({
    running: false,
    activeNodeId: null,
  })
  const cancelRef = useRef(false)
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes

  const stop = useCallback(() => {
    cancelRef.current = true
    setState({ running: false, activeNodeId: null })
  }, [])

  useEffect(() => {
    return () => {
      cancelRef.current = true
    }
  }, [])

  const findNode = useCallback((id: string): INode | null => {
    const rf = nodesRef.current.find((candidate) => candidate.id === id)
    return readDomainNode(rf)
  }, [])

  const start = useCallback(
    async (triggerNodeId: string) => {
      cancelRef.current = false
      setState({ running: true, activeNodeId: null })

      const visited = new Set<string>()
      const queue: string[] = [triggerNodeId]
      let steps = 0

      while (queue.length > 0 && steps < MAX_STEPS) {
        if (cancelRef.current) return

        const nodeId = queue.shift()
        if (!nodeId || visited.has(nodeId)) continue

        const node = findNode(nodeId)
        if (!node) continue

        visited.add(nodeId)
        steps += 1
        setState({ running: true, activeNodeId: nodeId })

        const definition = getNodeDefinition(node.type)
        const { delayMs } = resolveExecutionConfig(definition?.execution)
        await sleep(delayMs)

        if (cancelRef.current) return

        const nextIds = getNextExecutionIds(node, definition)
        for (const nextId of nextIds) {
          if (!visited.has(nextId)) queue.push(nextId)
        }
      }

      if (!cancelRef.current) {
        setState({ running: false, activeNodeId: null })
      }
    },
    [findNode],
  )

  return { ...state, start, stop }
}
