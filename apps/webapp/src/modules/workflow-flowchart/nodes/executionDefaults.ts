import { RefreshCw, type LucideIcon } from "lucide-react"
import type { NodeExecutionConfig } from "./types"

export const DEFAULT_NODE_EXECUTION: Required<NodeExecutionConfig> = {
  delayMs: 1000,
  Icon: RefreshCw,
  activeClassName:
    "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
}

export function resolveExecutionConfig(
  execution: NodeExecutionConfig | undefined,
): Required<NodeExecutionConfig> {
  return {
    delayMs: execution?.delayMs ?? DEFAULT_NODE_EXECUTION.delayMs,
    Icon: execution?.Icon ?? DEFAULT_NODE_EXECUTION.Icon,
    activeClassName: execution?.activeClassName ?? DEFAULT_NODE_EXECUTION.activeClassName,
  }
}
