import { Table2 } from "lucide-react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeDeleteButton } from "../../components/NodeDeleteButton/NodeDeleteButton"
import type { FlowchartRfNode, NodeDefinition, SheetsConfiguration } from "../types"
import { renameNodeAction } from "../nodeActions"

function SheetsFlowNode({ data }: NodeProps) {
  const node = (data as { node?: FlowchartRfNode["data"]["node"] }).node
  const onDelete = (data as { onDelete?: (nodeId: string) => void }).onDelete
  if (!node) return null

  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      <NodeDeleteButton onDelete={() => onDelete?.(node.id)} />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:border-primary/60 hover:bg-accent/60 hover:shadow-sm">
        <Table2 className="h-5 w-5" />
      </div>
      <div className="whitespace-nowrap text-sm font-medium text-foreground">{node.title}</div>
      <Handle type="source" position={Position.Right} id="main" className="!bg-muted-foreground" />
    </div>
  )
}

export const sheetsNode: NodeDefinition<SheetsConfiguration> = {
  type: "node:sheets",
  defaultTitle: "Google Sheets",
  description: "Lee o escribe filas en Google Sheets.",
  Icon: Table2,
  category: "integraciones",
  defaultConfiguration: {
    spreadsheetId: "",
    range: "",
    values: "",
  },
  FlowComponent: SheetsFlowNode,
  actions: [renameNodeAction],
  handlers: {
    onConnect() {
      return true
    },
    onDelete() {
      return true
    },
  },
}
