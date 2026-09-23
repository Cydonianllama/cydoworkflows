import { createContext, useContext, useState, type ReactNode } from "react"
import type { HomeModuleStore } from "./homeStore.contract"
import { createHomeStore, useBoundStore } from "./homeStore.zustand"

const HomeStoreContext = createContext<HomeModuleStore | null>(null)

export function HomeStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createHomeStore)
  const value = useBoundStore(store)
  return <HomeStoreContext.Provider value={value}>{children}</HomeStoreContext.Provider>
}

export function useHomeStore(): HomeModuleStore {
  const ctx = useContext(HomeStoreContext)
  if (!ctx) throw new Error("useHomeStore debe usarse dentro de <HomeStoreProvider>")
  return ctx
}
