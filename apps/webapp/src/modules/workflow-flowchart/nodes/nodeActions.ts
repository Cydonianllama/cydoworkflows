import type { NodeAction } from "./types"

export const renameNodeAction: NodeAction = {
  id: "rename",
  label: "Nombre del nodo",
}

export const DEFAULT_NODE_ACTIONS: NodeAction[] = [renameNodeAction]

export function resolveNodeActions(actions?: NodeAction[]): NodeAction[] {
  return actions ?? DEFAULT_NODE_ACTIONS
}

export function hasNodeAction(actions: NodeAction[] | undefined, id: string): boolean {
  return resolveNodeActions(actions).some((action) => action.id === id)
}
