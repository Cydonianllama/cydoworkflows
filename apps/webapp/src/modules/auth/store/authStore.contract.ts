/**
 * Contrato del estado del módulo. Deliberadamente agnóstico de la librería:
 * no menciona Zustand, sólo la forma del estado y sus acciones.
 */
export interface AuthModuleState {
  /** Email en proceso de verificación (registro → OTP). */
  pendingEmail: string
  loading: boolean
}

export interface AuthModuleActions {
  setPendingEmail(email: string): void
  setLoading(loading: boolean): void
  reset(): void
}

export type AuthModuleStore = AuthModuleState & AuthModuleActions
