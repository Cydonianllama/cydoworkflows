import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/utils/cn"

export interface GlobalSearchProps {
  value: string
  onSearch: (value: string) => void
  placeholder?: string
  delay?: number
  className?: string
  disabled?: boolean
}

/**
 * Buscador reutilizable con debounce propio. No conoce el módulo que lo usa:
 * recibe `value` y notifica cambios vía `onSearch`.
 */
export function GlobalSearch({
  value,
  onSearch,
  placeholder = "Buscar…",
  delay = 350,
  className,
  disabled = false,
}: GlobalSearchProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onSearch(draft.trim()), delay)
    return () => clearTimeout(timer)
  }, [draft, value, delay, onSearch])

  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
      />
    </div>
  )
}
