import { nameSchema, passwordSchema } from "@cydo/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getInviteRequest, type GetInviteResponseDTO } from "@/lib/api/members"
import { useAuthModuleActions } from "../actions/useAuthModuleActions"
import { AuthCard } from "../components/AuthCard"
import { TextField } from "../components/TextField/TextField"

const acceptInviteFormSchema = z.object({ name: nameSchema, password: passwordSchema })
type AcceptInviteFormValues = z.infer<typeof acceptInviteFormSchema>

export interface AcceptInviteFormProps {
  token: string
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const { acceptInviteAction, loading } = useAuthModuleActions()
  const [invite, setInvite] = useState<GetInviteResponseDTO | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteFormSchema),
    defaultValues: { name: "", password: "" },
  })

  useEffect(() => {
    let active = true
    void (async () => {
      const req = await getInviteRequest(token)
      if (!active) return
      if (!req || !req.status) {
        setError(req?.message ?? "La invitación no es válida o ya expiró")
      } else {
        setInvite(req.data)
      }
      setChecking(false)
    })()
    return () => {
      active = false
    }
  }, [token])

  if (checking) {
    return (
      <AuthCard title="Invitación" description="Validando tu invitación…">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </AuthCard>
    )
  }

  if (error || !invite) {
    return (
      <AuthCard title="Invitación inválida" description={error ?? "No pudimos encontrar esta invitación."}>
        <p className="text-sm text-muted-foreground">Pide a quien te invitó que envíe una nueva.</p>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Acepta tu invitación"
      description={`Te unirás a la cuenta de ${invite.email.split("@")[0]} como ${invite.roleInAccount}.`}
    >
      <form className="space-y-4" onSubmit={form.handleSubmit((values) => void acceptInviteAction(token, values))}>
        <TextField
          label="Nombre"
          autoComplete="name"
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <p className="text-xs text-muted-foreground">Invitación para {invite.email}</p>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Uniéndome…" : "Aceptar invitación"}
        </Button>
      </form>
    </AuthCard>
  )
}
