import { create } from "zustand"
import { useStore } from "zustand"
import type { StoreApi, UseBoundStore } from "zustand"
import type { SettingsModuleStore } from "./settingsStore.contract"

const initialState = {
  members: [],
  invites: [],
  loading: false,
  inviting: false,
  pendingMemberId: null,
}

/** Único archivo del módulo que conoce Zustand. */
export function createSettingsStore(): UseBoundStore<StoreApi<SettingsModuleStore>> {
  return create<SettingsModuleStore>()((set) => ({
    ...initialState,
    setMembers: (members) => set({ members }),
    setInvites: (invites) => set({ invites }),
    setLoading: (loading) => set({ loading }),
    setInviting: (inviting) => set({ inviting }),
    setPendingMemberId: (pendingMemberId) => set({ pendingMemberId }),
    replaceMember: (member) =>
      set((state) => ({ members: state.members.map((item) => (item.id === member.id ? member : item)) })),
    removeMemberLocal: (id) => set((state) => ({ members: state.members.filter((item) => item.id !== id) })),
    reset: () => set(initialState),
  }))
}

export function useBoundStore(store: UseBoundStore<StoreApi<SettingsModuleStore>>): SettingsModuleStore {
  return useStore(store)
}
