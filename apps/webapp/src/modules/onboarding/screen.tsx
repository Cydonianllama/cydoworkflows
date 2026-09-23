import { OnboardingWizard } from "./compositions/OnboardingWizard"
import { OnboardingStoreProvider } from "./store"

/** Vista principal del módulo onboarding. */
export function OnboardingScreen() {
  return (
    <OnboardingStoreProvider>
      <OnboardingWizard />
    </OnboardingStoreProvider>
  )
}
