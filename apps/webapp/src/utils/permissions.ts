import type { AuthSessionUser } from "@cydo/auth"

/** Permisos en cliente: sólo para mostrar/ocultar UI. La API siempre revalida. */
export function canInviteMembers(user: AuthSessionUser | null): boolean {
  return user?.roleInAccount === "owner" || user?.roleInAccount === "admin"
}

export function canManageRoles(user: AuthSessionUser | null): boolean {
  return user?.roleInAccount === "owner"
}

export function canRemoveMembers(user: AuthSessionUser | null): boolean {
  return user?.roleInAccount === "owner"
}

export function canWriteWorkflows(user: AuthSessionUser | null): boolean {
  return Boolean(user) && user?.status !== "restricted"
}

export function isRestricted(user: AuthSessionUser | null): boolean {
  return user?.status === "restricted"
}
