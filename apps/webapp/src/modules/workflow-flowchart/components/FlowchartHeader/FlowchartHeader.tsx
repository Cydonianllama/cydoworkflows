import { useRef } from "react"
import { Check, History, MoreHorizontal, Pencil, RotateCcw, Send, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/utils/cn"
import type { FlowchartHeaderProps } from "./flowchartHeaderProps"

export type { FlowchartHeaderProps, FlowchartHeaderBadgeVariant } from "./flowchartHeaderProps"

export function FlowchartHeader({
  name,
  editing,
  draft,
  saving = false,
  className,
  badge,
  publishLabel = null,
  publishing = false,
  showRevert = false,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
  onPublish,
  onOpenVersions,
  onRevert,
}: FlowchartHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <header
      className={cn(
        "flex h-12 items-center gap-3  border-border bg-background px-4",
        className,
      )}
    >
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                onSave()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                onCancel()
              }
            }}
            className="h-8 max-w-md"
            autoFocus
            aria-label="Nombre del workflow"
            disabled={saving}
          />
          <Button
            type="button"
            size="icon"
            className="h-8 w-8"
            onClick={onSave}
            disabled={saving}
            aria-label="Guardar nombre"
            title="Guardar nombre"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCancel}
            disabled={saving}
            aria-label="Cancelar edición"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="group/name flex min-w-0 flex-1 items-center gap-2">
          <h1
            className="truncate text-sm font-semibold text-foreground"
            title={name || "Workflow"}
          >
            {name || "Workflow"}
          </h1>
          <button
            type="button"
            onClick={onEdit}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover/name:opacity-100"
            aria-label="Editar nombre"
            title="Editar nombre"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {badge ? (
            <Badge variant={badge.variant} className="shrink-0">
              {badge.label}
            </Badge>
          ) : null}
        </div>
      )}

      {publishLabel ? (
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={onPublish}
          disabled={editing || saving || publishing}
          aria-label={publishLabel === "Actualizar" ? "Actualizar workflow" : "Publicar workflow"}
          title={publishLabel}
        >
          {publishing ? (
            <Send className="h-4 w-4 animate-pulse" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {publishLabel}
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={editing || publishing}
            aria-label="Más opciones"
            title="Más opciones"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onOpenVersions}>
            <History className="h-4 w-4" />
            Versiones
          </DropdownMenuItem>
          {showRevert ? (
            <DropdownMenuItem onSelect={onRevert}>
              <RotateCcw className="h-4 w-4" />
              Revertir cambios
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
