export type OnboardingInviteRole = "admin" | "member"

export interface OnboardingInviteRow {
  email: string
  role: OnboardingInviteRole
}

export interface OnboardingModuleState {
  step: number
  jobRole: string
  expectedUsers: string
  invites: OnboardingInviteRow[]
  loading: boolean
}

export interface OnboardingModuleActions {
  setStep(step: number): void
  setJobRole(jobRole: string): void
  setExpectedUsers(expectedUsers: string): void
  addInvite(): void
  removeInvite(index: number): void
  updateInviteEmail(index: number, email: string): void
  updateInviteRole(index: number, role: OnboardingInviteRole): void
  setLoading(loading: boolean): void
  reset(): void
}

export type OnboardingModuleStore = OnboardingModuleState & OnboardingModuleActions
