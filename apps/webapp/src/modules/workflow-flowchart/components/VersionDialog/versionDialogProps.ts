import type { WorkflowVersionSummaryDTO } from "@/lib/api/workflows"

export interface VersionDialogProps {
  open: boolean
  onOpenChange(open: boolean): void
  versions: WorkflowVersionSummaryDTO[]
  loading: boolean
  restoringVersion: number | null
  disabled?: boolean
  onRestore(version: number): void
}
