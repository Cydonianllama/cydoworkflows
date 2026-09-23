import type { AccountOverviewResponseDTO } from "@/lib/api/members"

export interface HomeModuleState {
  overview: AccountOverviewResponseDTO | null
  loading: boolean
}

export interface HomeModuleActions {
  setOverview(overview: AccountOverviewResponseDTO | null): void
  setLoading(loading: boolean): void
}

export type HomeModuleStore = HomeModuleState & HomeModuleActions
