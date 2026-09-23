import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SelectFieldProps } from "./selectFieldProps"

/** Componente tonto: recibe las opciones por props, nunca consulta el catálogo. */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecciona una opción",
  error,
  disabled = false,
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

export type { SelectFieldProps }
