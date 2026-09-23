import { Outlet } from "react-router-dom"
import { useAsideOpen } from "@/hooks/useAsideOpen"
import { cn } from "@/utils/cn"
import { Aside } from "./Aside"
import { Header } from "./Header"

interface AppLayoutProps {
  fullBleed?: boolean
}

export function AppLayout({ fullBleed = false }: AppLayoutProps) {
  const { open: asideOpen, setOpen: setAsideOpen, toggle: toggleAside } = useAsideOpen()

  return (
    <div className="flex min-h-screen bg-muted/30">
      {asideOpen ? <Aside onClose={() => setAsideOpen(false)} /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header asideOpen={asideOpen} onToggleAside={toggleAside} />
        <main
          className={cn(
            "mx-auto w-full flex-1",
            !fullBleed && "max-w-5xl px-6 py-6",
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
