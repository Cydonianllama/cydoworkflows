import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface WorkflowNameDialogProps {
  open: boolean
  loading?: boolean
  maxLength?: number
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string) => void | Promise<void>
}

/** Componente con estado interno: no conoce store, api ni reglas de negocio. */
export function WorkflowNameDialog({
  open,
  loading = false,
  maxLength = 120,
  onOpenChange,
  onSubmit,
}: WorkflowNameDialogProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName("")
      setError(null)
    }
  }, [open])

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("El nombre es obligatorio")
      return
    }
    await onSubmit(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo workflow</DialogTitle>
          <DialogDescription>Por ahora sólo necesitamos un nombre.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="workflow-name">Nombre</Label>
          <Input
            id="workflow-name"
            autoFocus
            value={name}
            maxLength={maxLength}
            placeholder="Onboarding de clientes"
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSubmit()
            }}
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={loading} onClick={() => void handleSubmit()}>
            {loading ? "Creando…" : "Crear workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
