import type { WorkflowDTO } from "@/lib/api/workflows"

export interface WorkflowRowProps {
  workflow: WorkflowDTO
  deleting?: boolean
  canDelete?: boolean
  onDelete: (workflow: WorkflowDTO) => void
}
