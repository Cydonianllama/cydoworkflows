import { useEffect, useRef } from "react"

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (res: GoogleCredentialResponse) => void }): void
      renderButton(parent: HTMLElement, options: Record<string, unknown>): void
      disableAutoSelect(): void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityServices
  }
}

let gisPromise: Promise<void> | null = null

function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.google?.accounts?.id) return Promise.resolve()
  if (gisPromise) return gisPromise

  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-gsi]")
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google Identity Services")))
      return
    }
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.dataset.gsi = "true"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("No se pudo cargar Google Identity Services"))
    document.head.appendChild(script)
  })

  return gisPromise
}

export interface GoogleButtonProps {
  clientId: string
  onCredential: (idToken: string) => void
  onError?: (error: unknown) => void
  text?: "signin_with" | "signup_with" | "continue_with"
  width?: number
}

export function GoogleButton({
  clientId,
  onCredential,
  onError,
  text = "continue_with",
  width = 320,
}: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const credentialRef = useRef(onCredential)
  const errorRef = useRef(onError)

  credentialRef.current = onCredential
  errorRef.current = onError

  useEffect(() => {
    let cancelled = false

    loadGoogleIdentityServices()
      .then(() => {
        const container = containerRef.current
        const gis = window.google
        if (cancelled || !container || !gis) return

        gis.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => credentialRef.current(res.credential),
        })
        container.innerHTML = ""
        gis.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          logo_alignment: "left",
          text,
          width,
        })
      })
      .catch((error: unknown) => errorRef.current?.(error))

    return () => {
      cancelled = true
    }
  }, [clientId, text, width])

  return <div ref={containerRef} data-testid="google-button" />
}
