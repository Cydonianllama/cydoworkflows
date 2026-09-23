import { MarkerType, type Edge, type Node } from "@xyflow/react"
import { getOutgoingEdges } from "../nodes"
import type { INode } from "../nodes/types"

function buildEdge(source: string, target: string, sourceHandle: string): Edge {
  return {
    id: `edge_${source}_${target}_${sourceHandle}`,
    source,
    target,
    sourceHandle,
    targetHandle: null,
    markerEnd: { type: MarkerType.ArrowClosed },
  }
}

export function nodesToEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = []
  const seen = new Set<string>()

  for (const rfNode of nodes) {
    const domain = (rfNode.data as { node?: INode } | undefined)?.node
    if (!domain) continue

    for (const outgoing of getOutgoingEdges(domain)) {
      if (!outgoing.target) continue
      const edge = buildEdge(domain.id, outgoing.target, outgoing.sourceHandle)
      if (seen.has(edge.id)) continue
      seen.add(edge.id)
      edges.push(edge)
    }
  }

  return edges
}
