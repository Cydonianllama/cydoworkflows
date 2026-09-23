export interface NodeFieldBaseProps {
  label: string
  error?: string
  disabled?: boolean
  id?: string
}

export interface NodeInputProps extends NodeFieldBaseProps {
  value: string
  onChange(value: string): void
  placeholder?: string
  type?: "text" | "url" | "number"
}

export interface NodeSelectOption {
  value: string
  label: string
}

export interface NodeSelectProps extends NodeFieldBaseProps {
  value: string
  onChange(value: string): void
  options: NodeSelectOption[]
  placeholder?: string
}

export interface NodeSwitchProps extends NodeFieldBaseProps {
  value: boolean
  onChange(value: boolean): void
}

export interface NodeTextareaProps extends NodeFieldBaseProps {
  value: string
  onChange(value: string): void
  placeholder?: string
  rows?: number
}
