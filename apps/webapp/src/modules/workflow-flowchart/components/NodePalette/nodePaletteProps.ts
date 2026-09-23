import type { LucideIcon } from "lucide-react"
import type { FlowchartNodeType, NodeCategory } from "../../nodes/types"

export interface NodePaletteItem {
  type: FlowchartNodeType
  title: string
  description: string
  Icon: LucideIcon
  category: NodeCategory
}

export interface NodePaletteProps {
  items: NodePaletteItem[]
  onSelect: (type: FlowchartNodeType) => void
  onClose?: () => void
  className?: string
}
