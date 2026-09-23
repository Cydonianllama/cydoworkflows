import { create } from "zustand"
import { useStore } from "zustand"
import type { StoreApi, UseBoundStore } from "zustand"
import { DEFAULT_WORKFLOW_PAGE_SIZE } from "../catalog/workflowsCatalog"
import type { WorkflowsModuleStore } from "./workflowsStore.contract"

const initialState = {
  items: [],
  pagination: null,
  filters: { page: 1, limit: DEFAULT_WORKFLOW_PAGE_SIZE, search: "" },
  loading: false,
  creating: false,
  deletingId: null,
}

/** Único archivo del módulo que conoce Zustand. */
export function createWorkflowsStore(): UseBoundStore<StoreApi<WorkflowsModuleStore>> {
  return create<WorkflowsModuleStore>()((set) => ({
    ...initialState,
    setItems: (items) => set({ items }),
    setPagination: (pagination) => set({ pagination }),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    setLoading: (loading) => set({ loading }),
    setCreating: (creating) => set({ creating }),
    setDeletingId: (deletingId) => set({ deletingId }),
    removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
    reset: () => set(initialState),
  }))
}

export function useBoundStore(store: UseBoundStore<StoreApi<WorkflowsModuleStore>>): WorkflowsModuleStore {
  return useStore(store)
}
