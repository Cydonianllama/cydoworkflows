import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NoteColor } from "../../nodes/types"

const NOTE_COLOR_OPTIONS: Array<{ value: NoteColor; label: string; swatch: string }> = [
  { value: "amber", label: "Ámbar", swatch: "bg-amber-400" },
  { value: "red", label: "Rojo", swatch: "bg-red-400" },
  { value: "green", label: "Verde", swatch: "bg-green-400" },
  { value: "purple", label: "Púrpura", swatch: "bg-purple-400" },
  { value: "blue", label: "Azul", swatch: "bg-blue-400" },
]

export interface NoteDialogProps {
  open: boolean
  text: string
  color?: NoteColor
  onClose(): void
  onSave(text: string, color: NoteColor): void
}

export function NoteDialog({
  open,
  text,
  color = "amber",
  onClose,
  onSave,
}: NoteDialogProps) {
  const [draft, setDraft] = useState(text)
  const [draftColor, setDraftColor] = useState<NoteColor>(color)

  useEffect(() => {
    if (open) {
      setDraft(text)
      setDraftColor(color)
    }
  }, [open, text, color])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Editar nota"
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <div className="text-sm font-medium text-foreground">Nota</div>
          <div className="mt-1 text-xs text-muted-foreground">
            La nota no se conecta al flujo.
          </div>
        </div>

        <textarea
          className="h-40 w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          value={draft}
          placeholder="Escribí una nota…"
          onChange={(event) => setDraft(event.target.value)}
          autoFocus
        />

        <div className="mt-4">
          <div className="mb-2 text-xs font-medium text-foreground">Color</div>
          <div className="flex gap-2" role="radiogroup" aria-label="Color de la nota">
            {NOTE_COLOR_OPTIONS.map((option) => {
              const active = draftColor === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setDraftColor(option.value)}
                  className={`h-7 w-7 rounded-full ${option.swatch} transition-transform ${
                    active
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                />
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(draft, draftColor)
              onClose()
            }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
