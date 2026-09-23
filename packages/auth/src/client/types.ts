import type {
  CompleteOnboardingRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  VerifyOtpRequest,
} from "../core/dto"
import type { AuthSessionUser } from "../core/models"

export type AuthStatus = "loading" | "authenticated" | "anonymous"

export interface AuthContextValue {
  user: AuthSessionUser | null
  status: AuthStatus
  isAuthenticated: boolean
  register(input: RegisterRequest): Promise<RegisterResponse>
  verifyOtp(input: VerifyOtpRequest): Promise<AuthSessionUser>
  resendOtp(input: ResendOtpRequest): Promise<void>
  login(input: LoginRequest): Promise<AuthSessionUser>
  loginWithGoogle(input: GoogleLoginRequest): Promise<AuthSessionUser>
  logout(): Promise<void>
  refreshSession(): Promise<AuthSessionUser | null>
  completeOnboarding(input: CompleteOnboardingRequest): Promise<AuthSessionUser>
}
