import type { RunResult, RunStep } from "./types"

/**
 * Eventos que el pipeline emite durante la ejecución.
 * La API los usa para persistir el avance (WorkflowRun) sin que
 * el paquete conozca ninguna base de datos.
 */
export interface RunEvents {
  onRunStart?(info: { startedAt: Date }): Promise<void> | void
  onNodeStart?(step: { nodeId: string; type: string; startedAt: Date }): Promise<void> | void
  onNodeComplete?(step: RunStep): Promise<void> | void
  onNodeError?(step: RunStep): Promise<void> | void
  onRunFinish?(result: RunResult): Promise<void> | void
}
