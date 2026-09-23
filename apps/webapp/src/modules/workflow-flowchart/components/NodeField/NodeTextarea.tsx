import { Label } from "@/components/ui/label"
import { cn } from "@/utils/cn"
import type { NodeTextareaProps } from "./nodeFieldProps"

export function NodeTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  disabled = false,
  id,
}: NodeTextareaProps) {
  const textareaId = id ?? `node-textarea-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div className="space-y-1.5">
      <Label htmlFor={textareaId} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      <textarea
        id={textareaId}
        value={value}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={cn(
          "flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
        )}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
