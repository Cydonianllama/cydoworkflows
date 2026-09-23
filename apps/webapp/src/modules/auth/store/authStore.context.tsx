import { createContext, useContext, useState, type ReactNode } from "react"
import type { AuthModuleStore } from "./authStore.contract"
import { createAuthStore, useBoundStore } from "./authStore.zustand"

const AuthModuleStoreContext = createContext<AuthModuleStore | null>(null)

export function AuthModuleStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createAuthStore)
  const value = useBoundStore(store)
  return <AuthModuleStoreContext.Provider value={value}>{children}</AuthModuleStoreContext.Provider>
}

export function useAuthModuleStore(): AuthModuleStore {
  const ctx = useContext(AuthModuleStoreContext)
  if (!ctx) throw new Error("useAuthModuleStore debe usarse dentro de <AuthModuleStoreProvider>")
  return ctx
}
