import { useEffect, useMemo, type ReactNode } from "react"
import { useAuth } from "../hooks/useAuth"

export interface RequireOnboardingProps {
  children: ReactNode
  whenLoading?: ReactNode
  loginPath?: string
  homePath?: string
  requireVerified?: boolean
  verifyPath?: string
  navigate?: (to: string) => void
}

/**
 * Guard de la ruta de onboarding: exige sesión, exige email verificado
 * y expulsa a quien ya completó el onboarding.
 */
export function RequireOnboarding({
  children,
  whenLoading = null,
  loginPath = "/login",
  homePath = "/",
  requireVerified = true,
  verifyPath = "/verify-otp",
  navigate,
}: RequireOnboardingProps) {
  const { status, user } = useAuth()

  const target = useMemo(() => {
    if (status === "loading") return null
    if (status === "anonymous" || !user) return loginPath
    if (requireVerified && !user.emailVerified) return verifyPath
    if (user.onboardingCompleted) return homePath
    return null
  }, [status, user, loginPath, homePath, requireVerified, verifyPath])

  useEffect(() => {
    if (!target) return
    if (navigate) navigate(target)
    else window.location.assign(target)
  }, [target, navigate])

  if (status === "loading") return <>{whenLoading}</>
  if (target) return null
  return <>{children}</>
}
