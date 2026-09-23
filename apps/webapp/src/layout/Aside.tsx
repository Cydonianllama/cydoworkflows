import { NavLink } from "react-router-dom"
import { Home, PanelLeftClose, Settings, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home, end: true },
  { to: "/workflows", label: "Workflows", icon: Workflow, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
] as const

interface AsideProps {
  onClose: () => void
}

export function Aside({ onClose }: AsideProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          C
        </span>
        <span className="text-sm font-semibold">Cydo</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7"
          onClick={onClose}
          aria-label="Cerrar menú lateral"
          title="Cerrar menú"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
