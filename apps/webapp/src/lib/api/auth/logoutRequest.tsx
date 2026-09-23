import { api } from "@/setup/axiosSetup"

/** Best-effort: si falla, la sesión local igual se limpia. */
export const logoutRequest = async (): Promise<void> => {
  try {
    await api.post("/auth/logout")
  } catch {
    /* noop */
  }
}
