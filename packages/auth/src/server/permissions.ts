import type { AccountStatus, RoleInAccount } from "../core/models"

export type Permission =
  | "workflow:read"
  | "workflow:create"
  | "workflow:update"
  | "workflow:delete"
  | "member:invite"
  | "member:restrict"
  | "member:remove"
  | "member:role"

const READ_PERMISSIONS: Permission[] = ["workflow:read"]

const MEMBER_PERMISSIONS: Permission[] = [
  ...READ_PERMISSIONS,
  "workflow:create",
  "workflow:update",
  "workflow:delete",
]

const ADMIN_PERMISSIONS: Permission[] = [...MEMBER_PERMISSIONS, "member:invite", "member:restrict"]

const OWNER_PERMISSIONS: Permission[] = [...ADMIN_PERMISSIONS, "member:remove", "member:role"]

const BY_ROLE: Record<RoleInAccount, Permission[]> = {
  owner: OWNER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  member: MEMBER_PERMISSIONS,
}

export interface PermissionSubject {
  roleInAccount: RoleInAccount
  status: AccountStatus
}

export function permissionsFor(subject: PermissionSubject): Permission[] {
  if (subject.status === "restricted") return READ_PERMISSIONS
  return BY_ROLE[subject.roleInAccount]
}

export function can(subject: PermissionSubject, permission: Permission): boolean {
  return permissionsFor(subject).includes(permission)
}
