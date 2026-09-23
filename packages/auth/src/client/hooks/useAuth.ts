import { useContext } from "react"
import { AuthContext } from "../context"
import type { AuthContextValue } from "../types"

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>")
  return ctx
}

export function useAuthUser() {
  return useAuth().user
}

export function useIsAuthenticated(): boolean {
  return useAuth().isAuthenticated
}
