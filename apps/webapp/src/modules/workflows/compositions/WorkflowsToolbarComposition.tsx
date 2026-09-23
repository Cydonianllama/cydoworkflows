import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "@/features/globalSearch/GlobalSearch"
import { useWorkflowsActions } from "../actions/useWorkflowsActions"
import { useWorkflowFilters } from "../hooks/useWorkflowFilters"

export interface WorkflowsToolbarCompositionProps {
  onCreate: () => void
  canCreate: boolean
}

export function WorkflowsToolbarComposition({ onCreate, canCreate }: WorkflowsToolbarCompositionProps) {
  const { filters, loading, searchAction } = useWorkflowsActions()
  const { syncSearchToUrl } = useWorkflowFilters()

  const handleSearch = (value: string) => {
    syncSearchToUrl(value)
    void searchAction(value)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <GlobalSearch
        className="sm:max-w-sm"
        value={filters.search}
        disabled={loading}
        placeholder="Buscar por nombre…"
        onSearch={handleSearch}
      />
      {canCreate ? (
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Nuevo workflow
        </Button>
      ) : null}
    </div>
  )
}
