import { createContext, useContext, useState, type ReactNode } from "react"
import type { WorkflowsModuleStore } from "./workflowsStore.contract"
import { createWorkflowsStore, useBoundStore } from "./workflowsStore.zustand"

const WorkflowsStoreContext = createContext<WorkflowsModuleStore | null>(null)

export function WorkflowsStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createWorkflowsStore)
  const value = useBoundStore(store)
  return <WorkflowsStoreContext.Provider value={value}>{children}</WorkflowsStoreContext.Provider>
}

export function useWorkflowsStore(): WorkflowsModuleStore {
  const ctx = useContext(WorkflowsStoreContext)
  if (!ctx) throw new Error("useWorkflowsStore debe usarse dentro de <WorkflowsStoreProvider>")
  return ctx
}
