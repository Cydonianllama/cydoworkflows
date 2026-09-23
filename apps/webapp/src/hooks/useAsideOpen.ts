import { useEffect, useState } from "react"
import { useMediaQuery } from "./useMediaQuery"

const BREAKPOINT = "(max-width: 799.98px)"

export function useAsideOpen(defaultOpen = true): {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
} {
  const [open, setOpen] = useState(defaultOpen)
  const isNarrow = useMediaQuery(BREAKPOINT)

  useEffect(() => {
    if (isNarrow) setOpen(false)
  }, [isNarrow])

  return {
    open,
    setOpen,
    toggle: () => setOpen((value) => !value),
  }
}
