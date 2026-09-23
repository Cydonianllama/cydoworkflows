import type { Edge, Node } from "@xyflow/react"
import type { EdgeChange, NodeChange, Connection } from "@xyflow/react"
import type { MouseEvent as ReactMouseEvent } from "react"

export interface FlowchartCanvasProps {
  nodes: Node[]
  edges: Edge[]
  colorMode?: "light" | "dark"
  className?: string
  executingNodeId?: string | null
  executingEdgeIds?: ReadonlySet<string>
  onNodesChange?: (changes: NodeChange[]) => void
  onEdgesChange?: (changes: EdgeChange[]) => void
  onConnect?: (connection: Connection) => void
  onRemoveEdge?: (edgeId: string) => void
  onRemoveNode?: (nodeId: string) => void
  onNodeClick?: (event: ReactMouseEvent, node: Node) => void
  onNodeDoubleClick?: (event: ReactMouseEvent, node: Node) => void
  onNodeContextMenu?: (event: ReactMouseEvent, node: Node) => void
  onPaneClick?: (event: ReactMouseEvent) => void
  onPaneContextMenu?: (event: ReactMouseEvent | MouseEvent) => void
}
