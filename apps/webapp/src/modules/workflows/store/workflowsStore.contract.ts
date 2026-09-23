import type { WorkflowDTO } from "@/lib/api/workflows"
import type { ResponsePagination } from "@/lib/types/responsePagination"

export interface WorkflowFilters {
  page: number
  limit: number
  search: string
}

export interface WorkflowsModuleState {
  items: WorkflowDTO[]
  pagination: ResponsePagination | null
  filters: WorkflowFilters
  loading: boolean
  creating: boolean
  deletingId: string | null
}

export interface WorkflowsModuleActions {
  setItems(items: WorkflowDTO[]): void
  setPagination(pagination: ResponsePagination | null): void
  setFilters(filters: Partial<WorkflowFilters>): void
  setLoading(loading: boolean): void
  setCreating(creating: boolean): void
  setDeletingId(id: string | null): void
  removeItem(id: string): void
  reset(): void
}

export type WorkflowsModuleStore = WorkflowsModuleState & WorkflowsModuleActions
