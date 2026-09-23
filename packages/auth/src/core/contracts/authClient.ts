import type {
  CompleteOnboardingRequest,
  CompleteOnboardingResponse,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  VerifyOtpRequest,
} from "../dto"
import type { AuthSessionUser } from "../models"

/** Sobre mínimo de respuesta. El ResponseApi de la app es estructuralmente compatible. */
export interface ClientEnvelope<T> {
  status: boolean
  data: T
  message?: string
}

export interface AuthSessionPayload {
  user: AuthSessionUser
}

/**
 * Contrato que el cliente (webapp) implementa para conectar auth con un
 * backend concreto. El paquete no sabe si debajo hay axios, fetch o un mock.
 */
export interface AuthClientPort {
  register(data: RegisterRequest): Promise<ClientEnvelope<RegisterResponse> | null>
  verifyOtp(data: VerifyOtpRequest): Promise<ClientEnvelope<AuthSessionPayload> | null>
  resendOtp(data: ResendOtpRequest): Promise<ClientEnvelope<{ sent: boolean }> | null>
  login(data: LoginRequest): Promise<ClientEnvelope<AuthSessionPayload> | null>
  loginWithGoogle(data: GoogleLoginRequest): Promise<ClientEnvelope<AuthSessionPayload> | null>
  refresh(): Promise<ClientEnvelope<AuthSessionPayload> | null>
  logout(): Promise<void>
  me(): Promise<ClientEnvelope<AuthSessionUser> | null>
  completeOnboarding(data: CompleteOnboardingRequest): Promise<ClientEnvelope<CompleteOnboardingResponse> | null>
}
