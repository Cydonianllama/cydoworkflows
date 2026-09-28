import { Loader2, Play, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { formatDateTime } from "@/utils/format"
import type { WorkflowRowProps } from "./workflowRowProps"

export function WorkflowRow({ workflow, deleting = false, canDelete = true, onDelete }: WorkflowRowProps) {
  const published = workflow.status === "published"

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link to={`/workflows/${workflow.id}`} className="hover:underline">
          {workflow.name}
        </Link>
      </TableCell>
      <TableCell>
        {published ? (
          <Badge variant={workflow.hasUnpublishedChanges ? "warning" : "success"}>
            {workflow.hasUnpublishedChanges
              ? `Publicado v${workflow.version} · cambios`
              : `Publicado v${workflow.version}`}
          </Badge>
        ) : (
          <Badge variant="outline">Borrador</Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDateTime(workflow.createdAt)}</TableCell>
      <TableCell className="text-muted-foreground">
        <span className="inline-flex items-center gap-1.5" title="Ejecuciones">
          <Play className="h-3.5 w-3.5" />
          {workflow.runsCount ?? 0}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          disabled={deleting || !canDelete}
          aria-label={`Eliminar ${workflow.name}`}
          onClick={() => onDelete(workflow)}
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export type { WorkflowRowProps }
