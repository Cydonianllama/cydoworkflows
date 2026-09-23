import { Router } from "express"
import { requireAuth } from "../../middleware/requireAuth"
import { requirePermission } from "../../middleware/requirePermission"
import { validate } from "../../middleware/validate"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  acceptInviteHandler,
  getInviteHandler,
  inviteMemberHandler,
  listMembersHandler,
  removeMemberHandler,
  restrictMemberHandler,
  updateMemberRoleHandler,
} from "./members.controller"
import {
  acceptInviteSchema,
  inviteMemberSchema,
  inviteTokenParamSchema,
  memberIdParamSchema,
  restrictMemberSchema,
  updateMemberRoleSchema,
} from "./members.dto"

/** Rutas públicas para aceptar una invitación (sin sesión previa). */
export const invitesRouter = Router()

invitesRouter.get("/:token", validate(inviteTokenParamSchema, "params"), asyncHandler(getInviteHandler))
invitesRouter.post(
  "/:token/accept",
  validate(inviteTokenParamSchema, "params"),
  validate(acceptInviteSchema),
  asyncHandler(acceptInviteHandler),
)

/** Rutas protegidas de gestión de miembros. */
export const membersRouter = Router()

membersRouter.use(requireAuth)

membersRouter.get("/", requirePermission("member:invite"), asyncHandler(listMembersHandler))

membersRouter.post(
  "/invite",
  requirePermission("member:invite"),
  validate(inviteMemberSchema),
  asyncHandler(inviteMemberHandler),
)

membersRouter.patch(
  "/:id/role",
  requirePermission("member:role"),
  validate(memberIdParamSchema, "params"),
  validate(updateMemberRoleSchema),
  asyncHandler(updateMemberRoleHandler),
)

membersRouter.patch(
  "/:id/restrict",
  requirePermission("member:restrict"),
  validate(memberIdParamSchema, "params"),
  validate(restrictMemberSchema),
  asyncHandler(restrictMemberHandler),
)

membersRouter.delete(
  "/:id",
  requirePermission("member:remove"),
  validate(memberIdParamSchema, "params"),
  asyncHandler(removeMemberHandler),
)
