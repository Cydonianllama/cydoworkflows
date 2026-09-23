import { create } from "zustand"
import { useStore } from "zustand"
import type { StoreApi, UseBoundStore } from "zustand"
import type { FlowchartModuleStore } from "./flowchartStore.contract"

const initialState = {
  workflowId: "",
  workflowName: "",
  nodes: [],
  edges: [],
  loading: false,
  dirty: false,
  status: "draft" as const,
  version: 0,
  publishedAt: null as string | null,
  hasUnpublishedChanges: false,
  publishing: false,
}

/** Único archivo del módulo que conoce Zustand. */
export function createFlowchartStore(): UseBoundStore<StoreApi<FlowchartModuleStore>> {
  return create<FlowchartModuleStore>()((set) => ({
    ...initialState,
    setWorkflowId: (workflowId) => set({ workflowId }),
    setWorkflowName: (workflowName) => set({ workflowName }),
    setWorkflowMeta: (meta) =>
      set({
        status: meta.status,
        version: meta.version,
        publishedAt: meta.publishedAt,
        hasUnpublishedChanges: meta.hasUnpublishedChanges,
      }),
    setPublishing: (publishing) => set({ publishing }),
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setLoading: (loading) => set({ loading }),
    addNode: (node) =>
      set((state) => ({
        nodes: [...state.nodes, node],
        dirty: true,
      })),
    removeEdge: (id) =>
      set((state) => ({
        edges: state.edges.filter((edge) => edge.id !== id),
        dirty: true,
      })),
    markDirty: () => set({ dirty: true }),
    markSaved: () => set({ dirty: false }),
    reset: () => set(initialState),
  }))
}

export function useBoundStore(store: UseBoundStore<StoreApi<FlowchartModuleStore>>): FlowchartModuleStore {
  return useStore(store)
}
