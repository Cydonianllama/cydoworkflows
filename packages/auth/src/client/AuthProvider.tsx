import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { ClientEnvelope, AuthClientPort } from "../core/contracts/authClient"
import type {
  CompleteOnboardingRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResendOtpRequest,
  VerifyOtpRequest,
} from "../core/dto"
import type { AuthSessionUser } from "../core/models"
import { AuthContext } from "./context"
import type { AuthContextValue, AuthStatus } from "./types"

export interface AuthProviderProps {
  /** Adapter de persistencia/servidor. El paquete no conoce su implementación. */
  client: AuthClientPort
  children: ReactNode
  /** Carga la sesión al montar (usando client.me()). */
  bootstrap?: boolean
}

function unwrap<T>(res: ClientEnvelope<T> | null, fallback: string): T {
  if (!res) throw new Error(fallback)
  if (!res.status) throw new Error(res.message ?? fallback)
  return res.data
}

export function AuthProvider({ client, children, bootstrap = true }: AuthProviderProps) {
  const [user, setUser] = useState<AuthSessionUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  const clientRef = useRef(client)
  clientRef.current = client

  const refreshSession = useCallback(async (): Promise<AuthSessionUser | null> => {
    const res = await clientRef.current.me()
    if (res?.status) {
      setUser(res.data)
      setStatus("authenticated")
      return res.data
    }
    setUser(null)
    setStatus("anonymous")
    return null
  }, [])

  useEffect(() => {
    if (!bootstrap) {
      setStatus("anonymous")
      return
    }
    void refreshSession().catch(() => {
      setUser(null)
      setStatus("anonymous")
    })
  }, [bootstrap, refreshSession])

  const register = useCallback(async (input: RegisterRequest) => {
    return unwrap(await clientRef.current.register(input), "No pudimos crear tu cuenta")
  }, [])

  const verifyOtp = useCallback(async (input: VerifyOtpRequest) => {
    const payload = unwrap(await clientRef.current.verifyOtp(input), "No pudimos verificar el código")
    setUser(payload.user)
    setStatus("authenticated")
    return payload.user
  }, [])

  const resendOtp = useCallback(async (input: ResendOtpRequest) => {
    unwrap(await clientRef.current.resendOtp(input), "No pudimos reenviar el código")
  }, [])

  const login = useCallback(async (input: LoginRequest) => {
    const payload = unwrap(await clientRef.current.login(input), "Credenciales inválidas")
    setUser(payload.user)
    setStatus("authenticated")
    return payload.user
  }, [])

  const loginWithGoogle = useCallback(async (input: GoogleLoginRequest) => {
    const payload = unwrap(await clientRef.current.loginWithGoogle(input), "No pudimos iniciar con Google")
    setUser(payload.user)
    setStatus("authenticated")
    return payload.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await clientRef.current.logout()
    } finally {
      setUser(null)
      setStatus("anonymous")
    }
  }, [])

  const completeOnboarding = useCallback(async (input: CompleteOnboardingRequest) => {
    const payload = unwrap(
      await clientRef.current.completeOnboarding(input),
      "No pudimos completar el onboarding",
    )
    setUser(payload.user)
    return payload.user
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      register,
      verifyOtp,
      resendOtp,
      login,
      loginWithGoogle,
      logout,
      refreshSession,
      completeOnboarding,
    }),
    [user, status, register, verifyOtp, resendOtp, login, loginWithGoogle, logout, refreshSession, completeOnboarding],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
