import { Zap } from "lucide-react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeDeleteButton } from "../../components/NodeDeleteButton/NodeDeleteButton"
import type { FlowchartRfNode, NodeDefinition, TriggerConfiguration } from "../types"
import { renameNodeAction } from "../nodeActions"

function TriggerFlowNode({ data }: NodeProps) {
  const node = (data as { node?: FlowchartRfNode["data"]["node"] }).node
  const onDelete = (data as { onDelete?: (nodeId: string) => void }).onDelete
  if (!node) return null

  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      <NodeDeleteButton onDelete={() => onDelete?.(node.id)} />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:border-primary/60 hover:bg-accent/60 hover:shadow-sm">
        <Zap className="h-5 w-5" />
      </div>
      <div className="whitespace-nowrap text-sm font-medium text-foreground">{node.title}</div>
      <Handle type="source" position={Position.Right} id="main" className="!bg-muted-foreground" />
    </div>
  )
}

export const triggerNode: NodeDefinition<TriggerConfiguration> = {
  type: "node:trigger",
  defaultTitle: "Trigger",
  description: "Punto de entrada del flujo.",
  Icon: Zap,
  category: "triggers",
  defaultConfiguration: {},
  FlowComponent: TriggerFlowNode,
  actions: [renameNodeAction],
  handlers: {
    onConnect(event) {
      if (event.targetNode.type === "node:trigger") return false
      return true
    },
  },
}
