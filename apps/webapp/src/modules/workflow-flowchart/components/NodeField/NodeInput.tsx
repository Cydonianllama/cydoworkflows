import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/utils/cn"
import type { NodeInputProps } from "./nodeFieldProps"

export function NodeInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled = false,
  id,
}: NodeInputProps) {
  const inputId = id ?? `node-input-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      <Input
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={cn("h-8 text-sm", error && "border-destructive")}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
