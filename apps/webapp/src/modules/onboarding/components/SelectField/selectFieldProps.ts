import type { SelectOption } from "../../catalog/onboardingCatalog"

export interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: string
  disabled?: boolean
}
