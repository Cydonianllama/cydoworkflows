import { registerSchema, type RegisterRequest } from "@cydo/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuthModuleActions } from "../actions/useAuthModuleActions"
import { AUTH_CATALOG, ROUTES } from "../catalog/authCatalog"
import { AuthCard } from "../components/AuthCard"
import { GoogleSignIn } from "../components/GoogleSignIn"
import { TextField } from "../components/TextField/TextField"

export function RegisterForm() {
  const { registerAction, loginWithGoogleAction, loading } = useAuthModuleActions()
  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Te enviaremos un código para verificar tu email."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-medium text-foreground underline" to={ROUTES.login}>
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => void registerAction(values))}>
        <TextField
          label="Nombre"
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
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
          autoComplete="new-password"
          hint={`Mínimo ${AUTH_CATALOG.passwordMinLength} caracteres.`}
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
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
