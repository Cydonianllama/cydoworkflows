import { createContext, useContext, useState, type ReactNode } from "react"
import type { FlowchartModuleStore } from "./flowchartStore.contract"
import { createFlowchartStore, useBoundStore } from "./flowchartStore.zustand"

const FlowchartStoreContext = createContext<FlowchartModuleStore | null>(null)

export function FlowchartStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createFlowchartStore)
  const value = useBoundStore(store)
  return <FlowchartStoreContext.Provider value={value}>{children}</FlowchartStoreContext.Provider>
}

export function useFlowchartStore(): FlowchartModuleStore {
  const ctx = useContext(FlowchartStoreContext)
  if (!ctx) throw new Error("useFlowchartStore debe usarse dentro de <FlowchartStoreProvider>")
  return ctx
}
