import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/modules/auth/catalog/authCatalog"

export interface WelcomeBannerProps {
  name: string
  jobRole?: string | null
}

export function WelcomeBanner({ name, jobRole }: WelcomeBannerProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Bienvenido</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Hola, {name} 👋</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        {jobRole
          ? "Este es tu espacio de trabajo. Crea tu primer workflow o invita a tu equipo para empezar."
          : "Este es tu espacio de trabajo. Crea tu primer workflow para empezar."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild>
          <Link to={ROUTES.workflows}>Ir a workflows</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.settings}>Gestionar miembros</Link>
        </Button>
      </div>
    </section>
  )
}
