export type { AuthStatus, AuthContextValue } from "./types"
export { AuthContext } from "./context"
export { AuthProvider } from "./AuthProvider"
export type { AuthProviderProps } from "./AuthProvider"
export { useAuth, useAuthUser, useIsAuthenticated } from "./hooks/useAuth"
export { useAuthActions } from "./hooks/useAuthActions"
export { GoogleButton } from "./components/GoogleButton"
export type { GoogleButtonProps } from "./components/GoogleButton"
export { OtpInput } from "./components/OtpInput"
export type { OtpInputProps } from "./components/OtpInput"
export { RequireAuth } from "./components/RequireAuth"
export type { RequireAuthProps } from "./components/RequireAuth"
export { RequireOnboarding } from "./components/RequireOnboarding"
export type { RequireOnboardingProps } from "./components/RequireOnboarding"

export type { AuthClientPort, ClientEnvelope } from "../core/contracts/authClient"
export type {
  CompleteOnboardingRequest,
  CompleteOnboardingResponse,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  VerifyOtpRequest,
} from "../core/dto"
export type {
  AccountStatus,
  AuthSessionUser,
  AuthUser,
  Provider,
  RoleInAccount,
} from "../core/models"
