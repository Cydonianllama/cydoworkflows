import { RegisterForm } from "../compositions/RegisterForm"
import { AuthModuleStoreProvider } from "../store"

export function RegisterScreen() {
  return (
    <AuthModuleStoreProvider>
      <RegisterForm />
    </AuthModuleStoreProvider>
  )
}
