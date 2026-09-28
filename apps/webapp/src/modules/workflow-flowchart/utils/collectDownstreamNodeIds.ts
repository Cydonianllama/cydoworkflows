import type { Edge } from "@xyflow/react"

/**
 * Devuelve el nodo de arranque y todos sus descendientes (BFS sobre las edges).
 * Se usa para invalidar el estado "ejecutado" cuando cambia la configuración
 * de un nodo: los resultados de los nodos aguas abajo también quedan obsoletos.
 */
export function collectDownstreamNodeIds(startId: string, edges: Edge[]): string[] {
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    const targets = adjacency.get(edge.source)
    if (targets) targets.push(edge.target)
    else adjacency.set(edge.source, [edge.target])
  }

  const visited = new Set<string>([startId])
  const queue: string[] = [startId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined) continue
    for (const nextId of adjacency.get(current) ?? []) {
      if (visited.has(nextId)) continue
      visited.add(nextId)
      queue.push(nextId)
    }
  }

  return [...visited]
}
