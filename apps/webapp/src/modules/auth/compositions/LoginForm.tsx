import { loginSchema, type LoginRequest } from "@cydo/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuthModuleActions } from "../actions/useAuthModuleActions"
import { ROUTES } from "../catalog/authCatalog"
import { AuthCard } from "../components/AuthCard"
import { GoogleSignIn } from "../components/GoogleSignIn"
import { TextField } from "../components/TextField/TextField"

export function LoginForm() {
  const { loginAction, loginWithGoogleAction, loading } = useAuthModuleActions()
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  return (
    <AuthCard
      title="Inicia sesión"
      description="Entra a tu cuenta para gestionar tus workflows."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link className="font-medium text-foreground underline" to={ROUTES.register}>
            Crear cuenta
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => void loginAction(values))}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@empresa.com"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignIn
        disabled={loading}
        onCredential={(idToken) => void loginWithGoogleAction({ idToken })}
        onUnavailable={() => toast.error("No pudimos cargar Google Sign-In")}
      />
    </AuthCard>
  )
}
