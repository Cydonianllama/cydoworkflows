import type { NodeParameterEntry, NodeParameterField } from "../../nodes/types"

export interface ParametersEditorsProps {
  /** Schema desde NodeDefinition.parameters. */
  fields: NodeParameterField[]
  /** configuration.parameters actual. */
  values: NodeParameterEntry[]
  onChange(next: NodeParameterEntry[]): void
  /** Errores por type de parámetro, p.ej. { URL: "URL requerida" }. */
  errors?: Record<string, string>
}
