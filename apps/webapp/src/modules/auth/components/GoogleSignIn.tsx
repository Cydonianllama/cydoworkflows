import { GoogleButton } from "@cydo/auth/client"
import { env } from "@/setup/env"

export interface GoogleSignInProps {
  onCredential: (idToken: string) => void
  onUnavailable?: () => void
  disabled?: boolean
}

/** Envuelve el botón de Google del paquete y le pasa el clientId de la app. */
export function GoogleSignIn({ onCredential, onUnavailable, disabled = false }: GoogleSignInProps) {
  if (!env.VITE_GOOGLE_CLIENT_ID) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        Configura VITE_GOOGLE_CLIENT_ID para habilitar el acceso con Google.
      </p>
    )
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <GoogleButton
        clientId={env.VITE_GOOGLE_CLIENT_ID}
        onCredential={onCredential}
        onError={() => onUnavailable?.()}
        width={360}
      />
    </div>
  )
}
