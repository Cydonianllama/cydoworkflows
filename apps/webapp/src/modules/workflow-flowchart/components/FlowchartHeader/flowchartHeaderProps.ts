export type FlowchartHeaderBadgeVariant = "outline" | "success" | "warning"

export interface FlowchartHeaderProps {
  name: string
  editing: boolean
  draft: string
  saving?: boolean
  className?: string
  badge?: { variant: FlowchartHeaderBadgeVariant; label: string }
  publishLabel?: string | null
  publishing?: boolean
  showRevert?: boolean
  onEdit(): void
  onDraftChange(value: string): void
  onSave(): void
  onCancel(): void
  onPublish?(): void
  onOpenVersions?(): void
  onRevert?(): void
}
