import type { AuthClientPort } from "@cydo/auth"
import {
  completeOnboardingRequest,
  googleLoginRequest,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
  resendOtpRequest,
  verifyOtpRequest,
} from "@/lib/api/auth"

/**
 * Implementación del puerto de auth para el webapp.
 * @cydo/auth no conoce axios ni esta API: sólo este contrato.
 */
export const authClient: AuthClientPort = {
  register: (data) => registerRequest(data),
  verifyOtp: (data) => verifyOtpRequest(data),
  resendOtp: (data) => resendOtpRequest(data),
  login: (data) => loginRequest(data),
  loginWithGoogle: (data) => googleLoginRequest(data),
  refresh: () => refreshRequest(),
  logout: () => logoutRequest(),
  me: () => meRequest(),
  completeOnboarding: (data) => completeOnboardingRequest(data),
}
