import { useAuth } from "./useAuth"

/** Sólo las acciones de auth, sin exponer el estado. */
export function useAuthActions() {
  const {
    register,
    verifyOtp,
    resendOtp,
    login,
    loginWithGoogle,
    logout,
    refreshSession,
    completeOnboarding,
  } = useAuth()

  return { register, verifyOtp, resendOtp, login, loginWithGoogle, logout, refreshSession, completeOnboarding }
}
