import { Workflow } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"

export interface WorkflowsEmptyProps {
  searching: boolean
  canCreate?: boolean
  onCreate: () => void
}

export function WorkflowsEmpty({ searching, canCreate = true, onCreate }: WorkflowsEmptyProps) {
  if (searching) {
    return (
      <EmptyState
        icon={<Workflow className="h-6 w-6" />}
        title="Sin resultados"
        description="No encontramos workflows con ese nombre. Prueba con otra búsqueda."
      />
    )
  }

  return (
    <EmptyState
      icon={<Workflow className="h-6 w-6" />}
      title="Todavía no tienes workflows"
      description="Crea tu primer workflow para empezar a automatizar tu equipo."
      action={
        canCreate ? (
          <Button size="sm" onClick={onCreate}>
            Crear workflow
          </Button>
        ) : null
      }
    />
  )
}
