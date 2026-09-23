import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { RequireAuth, RequireOnboarding } from "@cydo/auth/client"
import { FullPageLoader } from "./FullPageLoader"

/** Rutas privadas: sesión + email verificado + onboarding completado. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <RequireAuth
      navigate={navigate}
      requireVerified
      requireOnboarding
      whenLoading={<FullPageLoader />}
      redirectTo="/login"
    >
      {children}
    </RequireAuth>
  )
}

/** Ruta de onboarding: sesión + email verificado, sin onboarding completado. */
export function OnboardingRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <RequireOnboarding navigate={navigate} whenLoading={<FullPageLoader />}>
      {children}
    </RequireOnboarding>
  )
}
