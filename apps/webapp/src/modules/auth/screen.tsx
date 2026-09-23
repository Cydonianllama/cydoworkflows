import { LoginForm } from "./compositions/LoginForm"
import { AuthModuleStoreProvider } from "./store"

/** Vista principal del módulo auth. */
export function AuthLoginScreen() {
  return (
    <AuthModuleStoreProvider>
      <LoginForm />
    </AuthModuleStoreProvider>
  )
}
