import { useEffect, useRef } from "react"
import { useSettingsActions } from "../actions/useSettingsActions"

/** Carga inicial de miembros e invitaciones, una sola vez por montaje. */
export function useSettingsInitialLoad() {
  const { fetchMembersAction } = useSettingsActions()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void fetchMembersAction()
  }, [fetchMembersAction])
}
