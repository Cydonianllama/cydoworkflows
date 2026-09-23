import type { LucideIcon } from "lucide-react"

export interface ContextMenuItem {
  id: string
  label: string
  icon?: LucideIcon
  disabled?: boolean
  onSelect(): void
}

export interface FlowchartContextMenuProps {
  open: boolean
  x: number
  y: number
  items: ContextMenuItem[]
  onClose(): void
}
