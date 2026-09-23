import { useEffect } from "react"
import { createPortal } from "react-dom"
import type { FlowchartContextMenuProps } from "./contextMenuProps"

export function FlowchartContextMenu({
  open,
  x,
  y,
  items,
  onClose,
}: FlowchartContextMenuProps) {
  useEffect(() => {
    if (!open) return

    const close = () => onClose()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("pointerdown", close, true)
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("pointerdown", close, true)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", close)
    }
  }, [open, onClose])

  if (!open || items.length === 0) return null

  return createPortal(
    <div
      className="fixed z-[60] min-w-44 overflow-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
      style={{ left: x, top: y }}
      role="menu"
      onPointerDown={(event) => event.stopPropagation()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
          onClick={() => {
            if (item.disabled) return
            item.onSelect()
            onClose()
          }}
        >
          {item.icon ? <item.icon className="h-3.5 w-3.5 shrink-0" /> : null}
          <span>{item.label}</span>
        </button>
      ))}
    </div>,
    document.body,
  )
}
