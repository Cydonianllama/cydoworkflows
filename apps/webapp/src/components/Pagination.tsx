import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"

export interface PaginationProps {
  page: number
  totalPages: number
  total: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
}

export function Pagination({
  page,
  totalPages,
  total,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  disabled = false,
  className,
}: PaginationProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <p className="text-xs text-muted-foreground">
        Página {page} de {Math.max(totalPages, 1)} · {total} en total
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !hasPreviousPage}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={disabled || !hasNextPage} onClick={() => onPageChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}
