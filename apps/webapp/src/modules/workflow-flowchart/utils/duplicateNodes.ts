import { MarkerType, type Edge, type Node } from "@xyflow/react"
import { getNodeDefinition } from "../nodes"
import type { INode } from "../nodes/types"

const DUPLICATE_OFFSET = { x: 40, y: 40 }

function createDuplicateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function mapDomainReferences(domain: INode, idMap: Map<string, string>): INode {
  const resolve = (id: string) => idMap.get(id) ?? id
  const definition = getNodeDefinition(domain.type)
  if (definition?.mapReferences) {
    return definition.mapReferences(domain, resolve)
  }
  return {
    ...domain,
    nextNode: domain.nextNode ? resolve(domain.nextNode) : domain.nextNode,
  }
}

export function duplicateNodes(
  nodesToDuplicate: Node[],
  allEdges: Edge[],
  offset: { x: number; y: number } = DUPLICATE_OFFSET,
): { nodes: Node[]; edges: Edge[] } {
  if (nodesToDuplicate.length === 0) return { nodes: [], edges: [] }

  const idMap = new Map<string, string>()
  for (const node of nodesToDuplicate) {
    idMap.set(node.id, createDuplicateId())
  }

  const newNodes: Node[] = []
  for (const node of nodesToDuplicate) {
    const domain = structuredClone((node.data as { node?: INode }).node)
    if (!domain) continue

    const nextId = idMap.get(node.id)
    if (!nextId) continue

    domain.id = nextId
    domain.createdAt = new Date().toISOString()
    const mapped = mapDomainReferences(domain, idMap)

    newNodes.push({
      ...node,
      id: nextId,
      position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
      selected: true,
      data: {
        ...node.data,
        node: mapped,
      },
    })
  }

  const newEdges = allEdges
    .filter((edge) => idMap.has(edge.source))
    .map((edge) => {
      const source = idMap.get(edge.source) ?? edge.source
      const target = idMap.get(edge.target) ?? edge.target
      const sourceHandle = edge.sourceHandle ?? "main"
      return {
        id: `edge_${source}_${target}_${sourceHandle}`,
        source,
        target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        markerEnd: { type: MarkerType.ArrowClosed },
      } satisfies Edge
    })

  return { nodes: newNodes, edges: newEdges }
}
