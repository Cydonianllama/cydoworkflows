import type { GoogleLoginRequest, LoginRequest, RegisterRequest, VerifyOtpRequest } from "@cydo/auth"
import { useAuthActions, useAuth } from "@cydo/auth/client"
import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { acceptInviteRequest } from "@/lib/api/members"
import { eventBus } from "@/lib/eventBus/eventBus"
import { errorMessage } from "@/utils/error"
import { ROUTES } from "../catalog/authCatalog"
import { useAuthModuleStore } from "../store"

export const useAuthModuleActions = () => {
  const navigate = useNavigate()
  const { pendingEmail, loading, setLoading, setPendingEmail } = useAuthModuleStore()
  const { refreshSession } = useAuth()
  const { login, register, verifyOtp, resendOtp, loginWithGoogle } = useAuthActions()

  const nextRoute = (onboardingCompleted: boolean) => (onboardingCompleted ? ROUTES.home : ROUTES.onboarding)

  const loginAction = useCallback(
    async (data: LoginRequest) => {
      try {
        setLoading(true)
        const user = await login(data)
        eventBus.emit("auth.session.started", { userId: user.id, email: user.email, provider: "local" })
        navigate(nextRoute(user.onboardingCompleted), { replace: true })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "No pudimos iniciar sesión"))
        return false
      } finally {
        setLoading(false)
      }
    },
    [login, navigate, setLoading],
  )

  const registerAction = useCallback(
    async (data: RegisterRequest) => {
      try {
        setLoading(true)
        await register(data)
        setPendingEmail(data.email)
        eventBus.emit("auth.user.registered", { email: data.email })
        navigate(ROUTES.verifyOtp, { replace: true, state: { email: data.email } })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "No pudimos crear tu cuenta"))
        return false
      } finally {
        setLoading(false)
      }
    },
    [navigate, register, setLoading, setPendingEmail],
  )

  const verifyOtpAction = useCallback(
    async (data: VerifyOtpRequest) => {
      try {
        setLoading(true)
        const user = await verifyOtp(data)
        eventBus.emit("auth.user.verified", { userId: user.id, email: user.email })
        eventBus.emit("auth.session.started", { userId: user.id, email: user.email, provider: "local" })
        navigate(nextRoute(user.onboardingCompleted), { replace: true })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Código inválido"))
        return false
      } finally {
        setLoading(false)
      }
    },
    [navigate, setLoading, verifyOtp],
  )

  const resendOtpAction = useCallback(
    async (email: string) => {
      try {
        await resendOtp({ email })
        toast.success("Te enviamos un código nuevo")
        return true
      } catch (error) {
        toast.error(errorMessage(error, "No pudimos reenviar el código"))
        return false
      }
    },
    [resendOtp],
  )

  const loginWithGoogleAction = useCallback(
    async (data: GoogleLoginRequest) => {
      try {
        setLoading(true)
        const user = await loginWithGoogle(data)
        eventBus.emit("auth.session.started", { userId: user.id, email: user.email, provider: "google" })
        navigate(nextRoute(user.onboardingCompleted), { replace: true })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "No pudimos validar tu cuenta de Google"))
        return false
      } finally {
        setLoading(false)
      }
    },
    [loginWithGoogle, navigate, setLoading],
  )

  const acceptInviteAction = useCallback(
    async (token: string, data: { name: string; password: string }) => {
      try {
        setLoading(true)
        const req = await acceptInviteRequest(token, data)

        if (!req) {
          toast.error("No pudimos aceptar la invitación")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "La invitación no es válida")
          return false
        }

        const user = await refreshSession()
        eventBus.emit("auth.session.started", {
          userId: user?.id ?? req.data.user.id,
          email: user?.email ?? req.data.user.email,
          provider: "local",
        })
        toast.success("Te uniste a la cuenta")
        navigate(nextRoute(user?.onboardingCompleted ?? true), { replace: true })
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (AcceptInviteAction)"))
        return false
      } finally {
        setLoading(false)
      }
    },
    [navigate, refreshSession, setLoading],
  )

  return {
    loginAction,
    registerAction,
    verifyOtpAction,
    resendOtpAction,
    loginWithGoogleAction,
    acceptInviteAction,
    loading,
    pendingEmail,
  }
}
