import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/utils/cn"
import type { NodeSelectProps } from "./nodeFieldProps"

export function NodeSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecciona una opción",
  error,
  disabled = false,
  id,
}: NodeSelectProps) {
  const selectId = id ?? `node-select-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div className="space-y-1.5">
      <Label htmlFor={selectId} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={selectId}
          aria-invalid={Boolean(error)}
          className={cn("h-8 text-sm", error && "border-destructive")}
        >
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
