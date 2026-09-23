import { useCallback } from "react"
import { createWorkflowRequest, deleteWorkflowRequest, listWorkflowsRequest } from "@/lib/api/workflows"
import { eventBus } from "@/lib/eventBus/eventBus"
import { errorMessage } from "@/utils/error"
import { toast } from "sonner"
import { useWorkflowsStore } from "../store"
import type { WorkflowFilters } from "../store"

export const useWorkflowsActions = () => {
  const {
    items,
    pagination,
    filters,
    loading,
    creating,
    deletingId,
    setItems,
    setPagination,
    setFilters,
    setLoading,
    setCreating,
    setDeletingId,
    removeItem,
  } = useWorkflowsStore()

  const fetchWorkflowsAction = useCallback(
    async (overrides: Partial<WorkflowFilters> = {}) => {
      const next: WorkflowFilters = { ...filters, ...overrides }

      try {
        setLoading(true)

        const req = await listWorkflowsRequest({
          page: next.page,
          limit: next.limit,
          search: next.search,
        })

        if (!req) {
          toast.error("Error al cargar workflows")
          return
        }

        if (!req.status) {
          toast.error(req.message ?? "Error al cargar workflows")
          return
        }

        if (!req.data?.items) {
          toast.error("Respuesta inesperada del servidor")
          return
        }

        setItems(req.data.items)
        setPagination(req.pagination ?? null)
        setFilters(next)
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (ListWorkflowsAction)"))
      } finally {
        setLoading(false)
      }
    },
    [filters, setFilters, setItems, setLoading, setPagination],
  )

  const createWorkflowAction = useCallback(
    async (name: string) => {
      try {
        setCreating(true)

        const req = await createWorkflowRequest({ name })

        if (!req) {
          toast.error("No pudimos crear el workflow")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "No pudimos crear el workflow")
          return false
        }

        if (!req.data?.workflow) {
          toast.error("Respuesta inesperada del servidor")
          return false
        }

        eventBus.emit("workflow.created", {
          workflowId: req.data.workflow.id,
          name: req.data.workflow.name,
        })

        await fetchWorkflowsAction({ page: 1 })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (CreateWorkflowAction)"))
        return false
      } finally {
        setCreating(false)
      }
    },
    [fetchWorkflowsAction, setCreating],
  )

  const deleteWorkflowAction = useCallback(
    async (id: string) => {
      try {
        setDeletingId(id)

        const req = await deleteWorkflowRequest(id)

        if (!req) {
          toast.error("No pudimos eliminar el workflow")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "No pudimos eliminar el workflow")
          return false
        }

        if (!req.data?.id) {
          toast.error("Respuesta inesperada del servidor")
          return false
        }

        removeItem(req.data.id)
        eventBus.emit("workflow.deleted", { workflowId: req.data.id })

        if (items.length === 1 && filters.page > 1) {
          await fetchWorkflowsAction({ page: filters.page - 1 })
        }

        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (DeleteWorkflowAction)"))
        return false
      } finally {
        setDeletingId(null)
      }
    },
    [fetchWorkflowsAction, filters.page, items.length, removeItem, setDeletingId],
  )

  const goToPageAction = useCallback(
    (page: number) => fetchWorkflowsAction({ page }),
    [fetchWorkflowsAction],
  )

  const searchAction = useCallback(
    (search: string) => fetchWorkflowsAction({ search, page: 1 }),
    [fetchWorkflowsAction],
  )

  const changePageSizeAction = useCallback(
    (limit: number) => fetchWorkflowsAction({ limit, page: 1 }),
    [fetchWorkflowsAction],
  )

  return {
    fetchWorkflowsAction,
    createWorkflowAction,
    deleteWorkflowAction,
    goToPageAction,
    searchAction,
    changePageSizeAction,
    items,
    pagination,
    filters,
    loading,
    creating,
    deletingId,
  }
}
