import { useEffect, useRef, type ComponentType } from "react"
import type { NodeProps } from "@xyflow/react"
import { CircleAlert, CircleCheck } from "lucide-react"
import { resolveExecutionConfig } from "./executionDefaults"
import type { NodeDefinition, NodeExecutionStatus } from "./types"

type ExecutionNodeData = { executing?: boolean; executedStatus?: NodeExecutionStatus }

function isExecuting(data: unknown): boolean {
  if (!data || typeof data !== "object") return false
  return Boolean((data as ExecutionNodeData).executing)
}

function readExecutedStatus(data: unknown): NodeExecutionStatus | null {
  if (!data || typeof data !== "object") return null
  const status = (data as ExecutionNodeData).executedStatus
  return status === "success" || status === "error" ? status : null
}

function findIconBox(root: HTMLElement): HTMLElement | null {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>("div"))
  return (
    candidates.find(
      (el) =>
        el.classList.contains("h-10") &&
        el.classList.contains("w-10") &&
        el.classList.contains("rounded-lg"),
    ) ?? null
  )
}

export function createExecutionAwareComponent(
  definition: NodeDefinition,
): ComponentType<NodeProps> {
  const Wrapped = definition.FlowComponent

  return function ExecutionAwareNode(props: NodeProps) {
    const rootRef = useRef<HTMLDivElement>(null)
    const executing = isExecuting(props.data)
    const executedStatus = executing ? null : readExecutedStatus(props.data)
    const { Icon, activeClassName } = resolveExecutionConfig(definition.execution)
    const tokens = activeClassName.split(/\s+/).filter(Boolean)

    useEffect(() => {
      const root = rootRef.current
      if (!root) return

      const iconBox = findIconBox(root)
      if (!iconBox) return

      if (executing) {
        iconBox.classList.add(...tokens)
      } else {
        iconBox.classList.remove(...tokens)
      }

      return () => {
        iconBox.classList.remove(...tokens)
      }
    }, [executing, activeClassName, tokens.join(" ")])

    return (
      <div ref={rootRef} className="relative">
        <Wrapped {...props} />
        {executing ? (
          <Icon
            className="pointer-events-none absolute left-1/2 top-5 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-spin text-emerald-600 drop-shadow-sm"
            aria-hidden="true"
          />
        ) : null}
        {executedStatus ? (
          <span
            data-testid="node-executed-badge"
            data-status={executedStatus}
            className={`pointer-events-none absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-background ${
              executedStatus === "error" ? "text-red-600" : "text-emerald-600"
            }`}
            aria-hidden="true"
            title={executedStatus === "error" ? "Nodo con error" : "Nodo ejecutado"}
          >
            {executedStatus === "error" ? (
              <CircleAlert className="h-4 w-4" />
            ) : (
              <CircleCheck className="h-4 w-4" />
            )}
          </span>
        ) : null}
      </div>
    )
  }
}
