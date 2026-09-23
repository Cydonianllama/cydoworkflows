import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { NodeSwitchProps } from "./nodeFieldProps"

export function NodeSwitch({
  label,
  value,
  onChange,
  error,
  disabled = false,
  id,
}: NodeSwitchProps) {
  const switchId = id ?? `node-switch-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={switchId} className="text-xs font-medium text-foreground">
        {label}
      </Label>
      <div className="flex flex-col items-end gap-1">
        <Switch id={switchId} checked={value} onCheckedChange={onChange} disabled={disabled} />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}
