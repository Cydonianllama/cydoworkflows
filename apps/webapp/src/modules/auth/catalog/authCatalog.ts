export const AUTH_CATALOG = {
  passwordMinLength: 8,
  otpLength: 6,
  otpResendCooldownSeconds: 60,
} as const

export const ROUTES = {
  login: "/login",
  register: "/register",
  verifyOtp: "/verify-otp",
  onboarding: "/onboarding",
  home: "/",
  workflows: "/workflows",
  settings: "/settings",
} as const
