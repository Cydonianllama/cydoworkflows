import type { AuthResult, AuthSessionUser, OnboardingProfileInput } from "./models"

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface RegisterResponse {
  requiresOtp: true
  email: string
}

export interface VerifyOtpRequest {
  email: string
  code: string
}

export interface ResendOtpRequest {
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface GoogleLoginRequest {
  idToken: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken: string | null
}

export interface CompleteOnboardingRequest extends OnboardingProfileInput {
  invites?: Array<{ email: string; role: "admin" | "member" }>
}

export type AuthResponse = AuthResult

export type MeResponse = AuthSessionUser

export interface CompleteOnboardingResponse {
  user: AuthSessionUser
  invited: string[]
}
