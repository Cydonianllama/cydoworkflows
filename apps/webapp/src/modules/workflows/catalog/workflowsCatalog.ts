import type { SelectOption } from "@/modules/onboarding/catalog/onboardingCatalog"

export const WORKFLOW_PAGE_SIZE_OPTIONS: SelectOption[] = [
  { value: "5", label: "5 por página" },
  { value: "10", label: "10 por página" },
  { value: "25", label: "25 por página" },
]

export const DEFAULT_WORKFLOW_PAGE_SIZE = 10
export const WORKFLOW_NAME_MAX_LENGTH = 120
