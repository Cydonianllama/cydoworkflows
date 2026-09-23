import { useParams } from "react-router-dom"
import { AcceptInviteForm } from "../compositions/AcceptInviteForm"
import { AuthModuleStoreProvider } from "../store"

export function AcceptInviteScreen() {
  const { token = "" } = useParams<{ token: string }>()

  return (
    <AuthModuleStoreProvider>
      <AcceptInviteForm token={token} />
    </AuthModuleStoreProvider>
  )
}
