import { GitFork } from "lucide-react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeDeleteButton } from "../../components/NodeDeleteButton/NodeDeleteButton"
import type { FlowchartRfNode, NodeDefinition, SwitchConfiguration } from "../types"
import { renameNodeAction } from "../nodeActions"

function SwitchFlowNode({ data }: NodeProps) {
  const node = (data as { node?: FlowchartRfNode["data"]["node"] }).node
  const onDelete = (data as { onDelete?: (nodeId: string) => void }).onDelete
  if (!node) return null

  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      <NodeDeleteButton onDelete={() => onDelete?.(node.id)} />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:border-primary/60 hover:bg-accent/60 hover:shadow-sm">
        <GitFork className="h-5 w-5" />
      </div>
      <div className="whitespace-nowrap text-sm font-medium text-foreground">{node.title}</div>
    </div>
  )
}

export const switchNode: NodeDefinition<SwitchConfiguration> = {
  type: "node:switch",
  defaultTitle: "Switch",
  description: "Divide el flujo en ramas.",
  Icon: GitFork,
  category: "logica",
  defaultConfiguration: {},
  FlowComponent: SwitchFlowNode,
  actions: [renameNodeAction],
  outgoingEdges() {
    return []
  },
  handlers: {
    onConnect(event) {
      if (event.sourceNode.type === "node:switch") return false
      return true
    },
    onDelete() {
      return true
    },
  },
}
