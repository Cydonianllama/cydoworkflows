import { X } from "lucide-react"

export interface NodeDeleteButtonProps {
  onDelete?: () => void
}

export function NodeDeleteButton({ onDelete }: NodeDeleteButtonProps) {
  if (!onDelete) return null

  return (
    <button
      type="button"
      aria-label="Eliminar nodo"
      title="Eliminar nodo"
      className="nodrag nopan absolute -right-2.5 -top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition-opacity hover:border-destructive hover:text-destructive group-hover:opacity-100"
      onClick={(event) => {
        event.stopPropagation()
        onDelete()
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          event.stopPropagation()
          onDelete()
        }
      }}
    >
      <X className="h-3 w-3" />
    </button>
  )
}
