import { create } from "zustand"
import { useStore } from "zustand"
import type { StoreApi, UseBoundStore } from "zustand"
import type { OnboardingModuleStore } from "./onboardingStore.contract"

const initialState = {
  step: 0,
  jobRole: "",
  expectedUsers: "",
  invites: [],
  loading: false,
}

/** Único archivo del módulo que conoce Zustand. */
export function createOnboardingStore(): UseBoundStore<StoreApi<OnboardingModuleStore>> {
  return create<OnboardingModuleStore>()((set) => ({
    ...initialState,
    setStep: (step) => set({ step }),
    setJobRole: (jobRole) => set({ jobRole }),
    setExpectedUsers: (expectedUsers) => set({ expectedUsers }),
    addInvite: () => set((state) => ({ invites: [...state.invites, { email: "", role: "member" }] })),
    removeInvite: (index) => set((state) => ({ invites: state.invites.filter((_, i) => i !== index) })),
    updateInviteEmail: (index, email) =>
      set((state) => ({
        invites: state.invites.map((invite, i) => (i === index ? { ...invite, email } : invite)),
      })),
    updateInviteRole: (index, role) =>
      set((state) => ({
        invites: state.invites.map((invite, i) => (i === index ? { ...invite, role } : invite)),
      })),
    setLoading: (loading) => set({ loading }),
    reset: () => set(initialState),
  }))
}

export function useBoundStore(store: UseBoundStore<StoreApi<OnboardingModuleStore>>): OnboardingModuleStore {
  return useStore(store)
}
