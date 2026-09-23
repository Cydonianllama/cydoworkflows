import type {
  AuthSessionPayload,
  AuthSessionUser,
  CompleteOnboardingResponse,
  RegisterResponse,
} from "@cydo/auth"

export type RegisterResponseDTO = RegisterResponse
export type SessionResponseDTO = AuthSessionPayload
export type MeResponseDTO = AuthSessionUser
export type OnboardingResponseDTO = CompleteOnboardingResponse

export interface ResendOtpResponseDTO {
  sent: boolean
}

export interface LogoutResponseDTO {
  ok: boolean
}
