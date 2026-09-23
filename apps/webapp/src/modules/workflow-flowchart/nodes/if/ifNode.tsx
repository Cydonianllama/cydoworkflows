import { GitBranch } from "lucide-react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeDeleteButton } from "../../components/NodeDeleteButton/NodeDeleteButton"
import type {
  FlowchartRfNode,
  INode,
  IfConfiguration,
  NodeDefinition,
  OutgoingEdge,
} from "../types"
import { renameNodeAction } from "../nodeActions"

function readIfConfiguration(configuration: unknown): IfConfiguration {
  if (!configuration || typeof configuration !== "object") {
    return { condition: "", trueNextNode: "", falseNextNode: "" }
  }
  const config = configuration as Partial<IfConfiguration>
  return {
    condition: typeof config.condition === "string" ? config.condition : "",
    trueNextNode: typeof config.trueNextNode === "string" ? config.trueNextNode : "",
    falseNextNode: typeof config.falseNextNode === "string" ? config.falseNextNode : "",
  }
}

function IfFlowNode({ data }: NodeProps) {
  const node = (data as { node?: FlowchartRfNode["data"]["node"] }).node
  const onDelete = (data as { onDelete?: (nodeId: string) => void }).onDelete
  if (!node) return null

  const config = readIfConfiguration(node.configuration)

  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      <NodeDeleteButton onDelete={() => onDelete?.(node.id)} />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:border-primary/60 hover:bg-accent/60 hover:shadow-sm">
        <GitBranch className="h-5 w-5" />
      </div>
      <div className="whitespace-nowrap text-sm font-medium text-foreground">{node.title}</div>
      <div className="flex flex-col gap-1">
        <div className="relative flex items-center">
          <div className="rounded border border-emerald-500/40 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            true
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ right: -6, top: "50%" }}
            className="!h-2 !w-2 !bg-emerald-500"
          />
        </div>
        <div className="relative flex items-center">
          <div className="rounded border border-rose-500/40 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            false
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ right: -6, top: "50%" }}
            className="!h-2 !w-2 !bg-rose-500"
          />
        </div>
      </div>
      {config.condition ? (
        <div className="max-w-[140px] truncate text-[10px] text-muted-foreground">
          {config.condition}
        </div>
      ) : null}
    </div>
  )
}

export const ifNode: NodeDefinition<IfConfiguration> = {
  type: "node:if",
  defaultTitle: "If",
  description: "Divide el flujo en ramas true/false según una condición.",
  Icon: GitBranch,
  category: "logica",
  defaultConfiguration: { condition: "", trueNextNode: "", falseNextNode: "" },
  FlowComponent: IfFlowNode,
  actions: [renameNodeAction],
  outgoingEdges(node: INode): OutgoingEdge[] {
    const config = readIfConfiguration(node.configuration)
    const edges: OutgoingEdge[] = []
    if (config.trueNextNode) edges.push({ sourceHandle: "true", target: config.trueNextNode })
    if (config.falseNextNode) edges.push({ sourceHandle: "false", target: config.falseNextNode })
    return edges
  },
  mapReferences(node: INode, resolve: (id: string) => string): INode {
    const config = readIfConfiguration(node.configuration)
    return {
      ...node,
      configuration: {
        ...config,
        trueNextNode: config.trueNextNode ? resolve(config.trueNextNode) : config.trueNextNode,
        falseNextNode: config.falseNextNode ? resolve(config.falseNextNode) : config.falseNextNode,
      },
    }
  },
  onExecute(node: INode) {
    const config = readIfConfiguration(node.configuration)
    if (config.trueNextNode) return { nextNodeIds: [config.trueNextNode] }
    if (config.falseNextNode) return { nextNodeIds: [config.falseNextNode] }
    return { nextNodeIds: [] }
  },
  handlers: {
    onConnect(event) {
      if (event.sourceHandle && event.sourceHandle !== "main") {
        if (event.sourceNode.type !== "node:if") return false
        return event.sourceHandle === "true" || event.sourceHandle === "false"
      }
      if (event.sourceNode.type === "node:if") return false
      return true
    },
    applyConnection(node, targetNodeId, sourceHandle) {
      if (sourceHandle !== "true" && sourceHandle !== "false") return null
      const config = readIfConfiguration(node.configuration)
      if (sourceHandle === "true") {
        return { ...node, configuration: { ...config, trueNextNode: targetNodeId } }
      }
      return { ...node, configuration: { ...config, falseNextNode: targetNodeId } }
    },
    onDisconnect(event) {
      const handle = event.sourceHandle
      if (handle !== "true" && handle !== "false") return null
      const config = readIfConfiguration(event.sourceNode.configuration)
      if (handle === "true") {
        if (!config.trueNextNode) return null
        return { ...event.sourceNode, configuration: { ...config, trueNextNode: "" } }
      }
      if (!config.falseNextNode) return null
      return { ...event.sourceNode, configuration: { ...config, falseNextNode: "" } }
    },
    onTargetRemoved(node, targetNodeId) {
      const config = readIfConfiguration(node.configuration)
      const trueMatch = config.trueNextNode === targetNodeId
      const falseMatch = config.falseNextNode === targetNodeId
      if (!trueMatch && !falseMatch) return null
      return {
        ...node,
        configuration: {
          ...config,
          trueNextNode: trueMatch ? "" : config.trueNextNode,
          falseNextNode: falseMatch ? "" : config.falseNextNode,
        },
      }
    },
    onDelete() {
      return true
    },
  },
}
