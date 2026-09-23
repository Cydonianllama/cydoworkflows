import { Pagination } from "@/components/Pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useConfirm } from "@/features/confirm/ConfirmProvider"
import type { WorkflowDTO } from "@/lib/api/workflows"
import { useWorkflowsActions } from "../actions/useWorkflowsActions"
import { WorkflowRow } from "../components/WorkflowRow/WorkflowRow"
import { WorkflowsEmpty } from "../components/WorkflowsEmpty"

export interface WorkflowsTableCompositionProps {
  onCreate: () => void
  canDelete: boolean
}

export function WorkflowsTableComposition({ onCreate, canDelete }: WorkflowsTableCompositionProps) {
  const {
    items,
    pagination,
    filters,
    loading,
    deletingId,
    goToPageAction,
    deleteWorkflowAction,
  } = useWorkflowsActions()
  const confirm = useConfirm()

  const handleDelete = async (workflow: WorkflowDTO) => {
    const accepted = await confirm({
      title: `¿Eliminar "${workflow.name}"?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      destructive: true,
    })
    if (!accepted) return
    await deleteWorkflowAction(workflow.id)
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    )
  }

  if (items.length === 0) {
    return <WorkflowsEmpty searching={Boolean(filters.search)} canCreate={canDelete} onCreate={onCreate} />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((workflow) => (
              <WorkflowRow
                key={workflow.id}
                workflow={workflow}
                deleting={deletingId === workflow.id}
                canDelete={canDelete}
                onDelete={(target) => void handleDelete(target)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={pagination?.page ?? filters.page}
        totalPages={pagination?.totalPages ?? 1}
        total={pagination?.total ?? items.length}
        hasNextPage={pagination?.hasNextPage ?? false}
        hasPreviousPage={pagination?.hasPreviousPage ?? false}
        disabled={loading}
        onPageChange={(page) => void goToPageAction(page)}
      />
    </div>
  )
}
