import { useEffect, useRef, type ComponentType } from "react"
import type { NodeProps } from "@xyflow/react"
import { resolveExecutionConfig } from "./executionDefaults"
import type { NodeDefinition } from "./types"

type ExecutableNodeData = { executing?: boolean }

function isExecuting(data: unknown): boolean {
  if (!data || typeof data !== "object") return false
  return Boolean((data as ExecutableNodeData).executing)
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
      </div>
    )
  }
}
