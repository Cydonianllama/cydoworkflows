import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/layout/AppLayout"
import { OnboardingRoute, ProtectedRoute } from "@/layout/guards"
import { AcceptInviteScreen, AuthLoginScreen, RegisterScreen, VerifyOtpScreen } from "@/modules/auth"
import { HomeScreen } from "@/modules/home"
import { OnboardingScreen } from "@/modules/onboarding"
import { SettingsScreen } from "@/modules/settings"
import { FlowchartScreen } from "@/modules/workflow-flowchart"
import { WorkflowsScreen } from "@/modules/workflows"

export function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<AuthLoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/verify-otp" element={<VerifyOtpScreen />} />
      <Route path="/accept-invite/:token" element={<AcceptInviteScreen />} />

      {/* Onboarding: sesión + email verificado, sin onboarding completado */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingScreen />
          </OnboardingRoute>
        }
      />

      {/* Privadas */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeScreen />} />
        <Route path="/workflows" element={<WorkflowsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AppLayout fullBleed />
          </ProtectedRoute>
        }
      >
        <Route path="/workflows/:id" element={<FlowchartScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
