import { MousePointerClick, RefreshCw } from "lucide-react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeDeleteButton } from "../../components/NodeDeleteButton/NodeDeleteButton"
import type {
  FlowchartRfNode,
  NodeDefinition,
  NodeExecuteResult,
  TriggerOnClickConfiguration,
} from "../types"
import { renameNodeAction } from "../nodeActions"

function TriggerOnClickFlowNode({ data }: NodeProps) {
  const node = (data as { node?: FlowchartRfNode["data"]["node"] }).node
  const onDelete = (data as { onDelete?: (nodeId: string) => void }).onDelete
  if (!node) return null

  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      <NodeDeleteButton onDelete={() => onDelete?.(node.id)} />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:border-primary/60 hover:bg-accent/60 hover:shadow-sm">
        <MousePointerClick className="h-5 w-5" />
      </div>
      <div className="whitespace-nowrap text-sm font-medium text-foreground">{node.title}</div>
      <Handle type="source" position={Position.Right} id="main" className="!bg-muted-foreground" />
    </div>
  )
}

export const triggerOnClickNode: NodeDefinition<TriggerOnClickConfiguration> = {
  type: "node:triggeronclick",
  defaultTitle: "Trigger On Click",
  description: "Dispara el flujo al hacer clic.",
  Icon: MousePointerClick,
  category: "triggers",
  defaultConfiguration: {},
  FlowComponent: TriggerOnClickFlowNode,
  actions: [renameNodeAction],
  execution: {
    delayMs: 1200,
    Icon: RefreshCw,
    activeClassName:
      "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  onExecute(node): NodeExecuteResult {
    return { nextNodeIds: node.nextNode ? [node.nextNode] : [] }
  },
  handlers: {
    onConnect(event) {
      if (event.targetNode.type === "node:triggeronclick") return false
      return true
    },
  },
}
