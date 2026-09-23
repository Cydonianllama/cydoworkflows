import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { NodeCategory } from "../../nodes/types"
import type { NodePaletteProps } from "./nodePaletteProps"

export type { NodePaletteItem, NodePaletteProps } from "./nodePaletteProps"

const CATEGORY_ORDER: NodeCategory[] = ["ia", "logica", "triggers", "integraciones", "misc"]

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  ia: "IA",
  logica: "Lógica",
  triggers: "Triggers",
  integraciones: "Integraciones",
  misc: "Misceláneos",
}

export function NodePalette({ items, onSelect, onClose, className }: NodePaletteProps) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    )
  }, [items, query])

  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        label: CATEGORY_LABELS[category],
        items: filtered.filter((item) => item.category === category),
      })).filter((group) => group.items.length > 0),
    [filtered],
  )

  return (
    <aside className={className}>
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <span className="text-xs font-semibold text-muted-foreground">Nodos</span>
        {onClose ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar paleta de nodos"
            className="h-6 w-6"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      <div className="px-3 pb-2 pt-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nodo..."
            aria-label="Buscar nodo"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
        {groups.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Sin resultados.</p>
        ) : (
          groups.map((group) => (
            <div key={group.category} className="flex flex-col gap-0.5">
              <span className="sticky top-0 z-10 mb-1 bg-background pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </span>
              {group.items.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onSelect(item.type)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                    <item.Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{item.title}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
