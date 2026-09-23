import type { LucideIcon } from "lucide-react"

export interface ExecuteFlowTriggerItem {
  id: string
  title: string
  Icon: LucideIcon
}

export interface ExecuteFlowButtonProps {
  triggers: ExecuteFlowTriggerItem[]
  running?: boolean
  onExecute: (triggerId: string) => void
  className?: string
}
