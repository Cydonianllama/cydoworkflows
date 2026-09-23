import { Loader2, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/utils/format"
import type { VersionDialogProps } from "./versionDialogProps"

export function VersionDialog({
  open,
  onOpenChange,
  versions,
  loading,
  restoringVersion,
  disabled = false,
  onRestore,
}: VersionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Versiones</DialogTitle>
          <DialogDescription>
            Historial de publicaciones. Restaurar una versión carga sus nodos como borrador.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : versions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no hay versiones publicadas.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {versions.map((version) => {
              const restoring = restoringVersion === version.version
              return (
                <li
                  key={version.version}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <Badge variant="outline" className="shrink-0">
                    v{version.version}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {version.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {version.nodeCount} nodos · {formatDateTime(version.publishedAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    disabled={disabled || restoring}
                    onClick={() => onRestore(version.version)}
                    aria-label={`Restaurar versión ${version.version}`}
                    title="Restaurar esta versión"
                  >
                    {restoring ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                    )}
                    Restaurar
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
