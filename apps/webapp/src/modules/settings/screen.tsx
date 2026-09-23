import { useAuth } from "@cydo/auth/client"
import { PageHeader } from "@/components/PageHeader"
import { canInviteMembers } from "@/utils/permissions"
import { SettingsInviteComposition } from "./compositions/SettingsInviteComposition"
import { SettingsMembersComposition } from "./compositions/SettingsMembersComposition"
import { SettingsStoreProvider } from "./store"

function SettingsView() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Administra quién tiene acceso a tu cuenta."
        actions={<SettingsInviteComposition canInvite={canInviteMembers(user)} />}
      />
      <SettingsMembersComposition />
    </div>
  )
}

/** Vista principal del módulo settings. */
export function SettingsScreen() {
  return (
    <SettingsStoreProvider>
      <SettingsView />
    </SettingsStoreProvider>
  )
}
