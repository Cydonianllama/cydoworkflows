import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/utils/cn"
import type { TextFieldProps } from "./textFieldProps"

/**
 * forwardRef es imprescindible: react-hook-form registra cada campo a través del
 * `ref` que devuelve register(). Sin reenviarlo, la validación ve los inputs vacíos.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? props.name

    return (
      <div className="space-y-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        <Input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(error && "border-destructive", className)}
          {...props}
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    )
  },
)

TextField.displayName = "TextField"

export type { TextFieldProps }
