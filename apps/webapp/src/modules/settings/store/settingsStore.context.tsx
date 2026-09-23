import { createContext, useContext, useState, type ReactNode } from "react"
import type { SettingsModuleStore } from "./settingsStore.contract"
import { createSettingsStore, useBoundStore } from "./settingsStore.zustand"

const SettingsStoreContext = createContext<SettingsModuleStore | null>(null)

export function SettingsStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createSettingsStore)
  const value = useBoundStore(store)
  return <SettingsStoreContext.Provider value={value}>{children}</SettingsStoreContext.Provider>
}

export function useSettingsStore(): SettingsModuleStore {
  const ctx = useContext(SettingsStoreContext)
  if (!ctx) throw new Error("useSettingsStore debe usarse dentro de <SettingsStoreProvider>")
  return ctx
}
