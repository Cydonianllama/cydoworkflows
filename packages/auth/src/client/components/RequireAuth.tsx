import { useEffect, useMemo, type ReactNode } from "react"
import { useAuth } from "../hooks/useAuth"

export interface RequireAuthProps {
  children: ReactNode
  /** Se renderiza mientras se resuelve la sesión (bootstrap). */
  whenLoading?: ReactNode
  redirectTo?: string
  requireVerified?: boolean
  verifyPath?: string
  requireOnboarding?: boolean
  onboardingPath?: string
  /** Inyectado desde el router (react-router). Por defecto usa window.location. */
  navigate?: (to: string) => void
}

export function RequireAuth({
  children,
  whenLoading = null,
  redirectTo = "/login",
  requireVerified = false,
  verifyPath = "/verify-otp",
  requireOnboarding = false,
  onboardingPath = "/onboarding",
  navigate,
}: RequireAuthProps) {
  const { status, user } = useAuth()

  const target = useMemo(() => {
    if (status === "loading") return null
    if (status === "anonymous" || !user) return redirectTo
    if (requireVerified && !user.emailVerified) return verifyPath
    if (requireOnboarding && !user.onboardingCompleted) return onboardingPath
    return null
  }, [status, user, redirectTo, requireVerified, verifyPath, requireOnboarding, onboardingPath])

  useEffect(() => {
    if (!target) return
    if (navigate) navigate(target)
    else window.location.assign(target)
  }, [target, navigate])

  if (status === "loading") return <>{whenLoading}</>
  if (target) return null
  return <>{children}</>
}
