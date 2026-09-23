import { create } from "zustand"
import { useStore } from "zustand"
import type { StoreApi, UseBoundStore } from "zustand"
import type { AuthModuleStore } from "./authStore.contract"

const initialState = {
  pendingEmail: "",
  loading: false,
}

/**
 * Único lugar del módulo que conoce Zustand.
 * components/, actions/ y compositions/ sólo ven `authStore.contract.ts`.
 */
export function createAuthStore(): UseBoundStore<StoreApi<AuthModuleStore>> {
  return create<AuthModuleStore>()((set) => ({
    ...initialState,
    setPendingEmail: (pendingEmail) => set({ pendingEmail }),
    setLoading: (loading) => set({ loading }),
    reset: () => set(initialState),
  }))
}

export function useBoundStore(store: UseBoundStore<StoreApi<AuthModuleStore>>): AuthModuleStore {
  return useStore(store)
}
