import type { NodeAction, NodeParameterField } from "../../nodes/types"

export interface NodeDialogNodeInfo {
  id: string
  title: string
  type: string
}

export interface NodeDialogProps {
  open: boolean
  node: NodeDialogNodeInfo | null
  prev: NodeDialogNodeInfo | null
  next: NodeDialogNodeInfo | null
  onClose: () => void
  actions?: NodeAction[]
  onRenameNode?: (nodeId: string, title: string) => void
  /** configuration actual del nodo seleccionado. */
  configuration?: unknown
  /** Schema de parámetros desde NodeDefinition.parameters. */
  parameters?: NodeParameterField[]
  onUpdateConfiguration?: (nodeId: string, configuration: unknown) => void
  /** Errores de validación por type de parámetro. */
  parameterErrors?: Record<string, string>
}
