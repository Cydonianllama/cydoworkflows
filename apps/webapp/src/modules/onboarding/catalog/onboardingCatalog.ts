export interface SelectOption {
  value: string
  label: string
}

export const JOB_ROLE_OPTIONS: SelectOption[] = [
  { value: "founder", label: "Founder / CEO" },
  { value: "product", label: "Product Manager" },
  { value: "engineering", label: "Engineering Lead" },
  { value: "operations", label: "Operations" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Otro" },
]

export const TEAM_SIZE_OPTIONS: SelectOption[] = [
  { value: "1", label: "Solo yo" },
  { value: "3", label: "2 - 3 personas" },
  { value: "10", label: "4 - 10 personas" },
  { value: "25", label: "11 - 25 personas" },
  { value: "50", label: "26 - 50 personas" },
  { value: "100", label: "Más de 50" },
]

export const INVITE_ROLE_OPTIONS: SelectOption[] = [
  { value: "member", label: "Miembro" },
  { value: "admin", label: "Administrador" },
]

export const ONBOARDING_STEPS = ["profile", "team", "invites"] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]
