import { createContext, useContext, useState, type ReactNode } from "react"
import type { OnboardingModuleStore } from "./onboardingStore.contract"
import { createOnboardingStore, useBoundStore } from "./onboardingStore.zustand"

const OnboardingStoreContext = createContext<OnboardingModuleStore | null>(null)

export function OnboardingStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createOnboardingStore)
  const value = useBoundStore(store)
  return <OnboardingStoreContext.Provider value={value}>{children}</OnboardingStoreContext.Provider>
}

export function useOnboardingStore(): OnboardingModuleStore {
  const ctx = useContext(OnboardingStoreContext)
  if (!ctx) throw new Error("useOnboardingStore debe usarse dentro de <OnboardingStoreProvider>")
  return ctx
}
