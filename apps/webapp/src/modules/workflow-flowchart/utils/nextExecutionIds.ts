import { getOutgoingEdges } from "../nodes/registry"
import type { INode, NodeDefinition } from "../nodes/types"

/**
 * Calcula los IDs de nodos siguientes para la simulación de ejecución.
 * Prioriza `definition.onExecute`; si no existe o no devuelve IDs, usa `getOutgoingEdges`.
 */
export function getNextExecutionIds(
  node: INode,
  definition: NodeDefinition | undefined,
): string[] {
  const result = definition?.onExecute?.(node)
  if (result && Array.isArray(result.nextNodeIds)) {
    return result.nextNodeIds.filter((id): id is string => Boolean(id))
  }
  return getOutgoingEdges(node)
    .map((edge) => edge.target)
    .filter((id): id is string => Boolean(id))
}
