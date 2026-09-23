import { OtpInput } from "@cydo/auth/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuthModuleActions } from "../actions/useAuthModuleActions"
import { AUTH_CATALOG } from "../catalog/authCatalog"
import { AuthCard } from "../components/AuthCard"
import { useOtpCountdown } from "../hooks/useOtpCountdown"

export interface VerifyOtpFormProps {
  email: string
}

export function VerifyOtpForm({ email }: VerifyOtpFormProps) {
  const { verifyOtpAction, resendOtpAction, loading } = useAuthModuleActions()
  const [code, setCode] = useState("")
  const { secondsLeft, canResend, start } = useOtpCountdown(AUTH_CATALOG.otpResendCooldownSeconds)

  useEffect(() => {
    start()
  }, [start])

  const submit = async () => {
    if (code.length !== AUTH_CATALOG.otpLength) return
    const ok = await verifyOtpAction({ email, code })
    if (!ok) setCode("")
  }

  return (
    <AuthCard
      title="Verifica tu email"
      description={`Ingresa el código de ${AUTH_CATALOG.otpLength} dígitos que enviamos a ${email || "tu correo"}.`}
    >
      <div className="flex justify-center">
        <OtpInput value={code} onChange={setCode} length={AUTH_CATALOG.otpLength} disabled={loading} onComplete={() => void submit()} />
      </div>

      <Button className="w-full" disabled={loading || code.length !== AUTH_CATALOG.otpLength} onClick={() => void submit()}>
        {loading ? "Verificando…" : "Verificar"}
      </Button>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{canResend ? "¿No llegó el código?" : `Reenviar en ${secondsLeft}s`}</span>
        <Button
          variant="link"
          size="sm"
          disabled={!canResend || loading}
          onClick={async () => {
            const ok = await resendOtpAction(email)
            if (ok) start()
          }}
        >
          Reenviar código
        </Button>
      </div>
    </AuthCard>
  )
}
