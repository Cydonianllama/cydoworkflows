import { Loader2 } from "lucide-react"

export function FullPageLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  )
}
