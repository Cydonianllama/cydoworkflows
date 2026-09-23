import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { VerifyOtpForm } from "../compositions/VerifyOtpForm"
import { ROUTES } from "../catalog/authCatalog"
import { AuthModuleStoreProvider } from "../store"

export function VerifyOtpScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = (location.state as { email?: string } | null)?.email ?? ""

  useEffect(() => {
    if (!email) navigate(ROUTES.register, { replace: true })
  }, [email, navigate])

  if (!email) return null

  return (
    <AuthModuleStoreProvider>
      <VerifyOtpForm email={email} />
    </AuthModuleStoreProvider>
  )
}
