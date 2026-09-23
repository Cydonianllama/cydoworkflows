import { Check, LogOut, Moon, Settings, Sun } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { AuthSessionUser } from "@cydo/auth"
import { useAuth } from "@cydo/auth/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/features/theme/ThemeProvider"
import { initials } from "@/utils/format"

interface UserCardProps {
  user: AuthSessionUser | null
}

export function UserCard({ user }: UserCardProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === "dark"

  const handleToggleDark = () => {
    setTheme(isDark ? "light" : "dark")
  }

  const handleSettings = () => {
    navigate("/settings")
  }

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto gap-2 px-2 py-1.5" aria-label="Menú de usuario">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">
            {initials(user?.profile.name ?? "?")}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight">
              {user?.profile.name ?? "—"}
            </span>
            <span className="block text-xs text-muted-foreground">{user?.email}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
          {user?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleToggleDark}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
          {isDark ? <Check className="ml-auto h-4 w-4" /> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettings}>
          <Settings className="h-4 w-4" />
          <span>Ir a ajustes</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
