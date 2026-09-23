import { useEffect, useMemo, useRef } from "react"

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  onComplete?: (value: string) => void
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  onComplete,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = useMemo(() => Array.from({ length }, (_, i) => value[i] ?? ""), [value, length])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (value.length === length) onComplete?.(value)
  }, [value, length, onComplete])

  const focusAt = (index: number) => {
    const target = Math.max(0, Math.min(length - 1, index))
    refs.current[target]?.focus()
  }

  const commit = (index: number, char: string) => {
    const next = digits.slice()
    next[index] = char
    const joined = next.join("").replace(/\D/g, "").slice(0, length)
    onChange(joined)
    if (char) focusAt(index + 1)
  }

  return (
    <div className="auth-otp" role="group" aria-label="Código de verificación">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          className="auth-otp__cell"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Dígito ${index + 1}`}
          onChange={(event) => commit(index, event.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index]) focusAt(index - 1)
          }}
          onPaste={(event) => {
            event.preventDefault()
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
            if (!pasted) return
            onChange(pasted)
            focusAt(pasted.length)
          }}
        />
      ))}
    </div>
  )
}
