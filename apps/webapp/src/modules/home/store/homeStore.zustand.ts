import { create } from "zustand"
import { useStore } from "zustand"
import type { StoreApi, UseBoundStore } from "zustand"
import type { HomeModuleStore } from "./homeStore.contract"

const initialState = {
  overview: null,
  loading: false,
}

/** Único archivo del módulo que conoce Zustand. */
export function createHomeStore(): UseBoundStore<StoreApi<HomeModuleStore>> {
  return create<HomeModuleStore>()((set) => ({
    ...initialState,
    setOverview: (overview) => set({ overview }),
    setLoading: (loading) => set({ loading }),
  }))
}

export function useBoundStore(store: UseBoundStore<StoreApi<HomeModuleStore>>): HomeModuleStore {
  return useStore(store)
}
