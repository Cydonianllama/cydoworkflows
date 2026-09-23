import { PanelLeft } from "lucide-react"
import { useAuth } from "@cydo/auth/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { isRestricted } from "@/utils/permissions"
import { UserCard } from "./UserCard"

interface HeaderProps {
  asideOpen: boolean
  onToggleAside: () => void
}

export function Header({ asideOpen, onToggleAside }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={onToggleAside}
        aria-label={asideOpen ? "Cerrar menú lateral" : "Abrir menú lateral"}
        aria-expanded={asideOpen}
        title={asideOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <div className="ml-auto flex items-center gap-3">
        {isRestricted(user) ? <Badge variant="warning">Sólo lectura</Badge> : null}
        <UserCard user={user} />
      </div>
    </header>
  )
}
