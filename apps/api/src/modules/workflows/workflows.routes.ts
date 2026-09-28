import { Router } from "express"
import { requireAuth } from "../../middleware/requireAuth"
import { requireNotRestricted } from "../../middleware/requireNotRestricted"
import { requirePermission } from "../../middleware/requirePermission"
import { requireVerified } from "../../middleware/requireVerified"
import { validate } from "../../middleware/validate"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  createWorkflowHandler,
  deleteWorkflowHandler,
  getWorkflowGraphHandler,
  getWorkflowHandler,
  getWorkflowRunHandler,
  getWorkflowVersionHandler,
  listWorkflowRunsHandler,
  listWorkflowVersionsHandler,
  listWorkflowsHandler,
  publishWorkflowHandler,
  restoreWorkflowVersionHandler,
  revertWorkflowChangesHandler,
  runWorkflowHandler,
  saveWorkflowGraphHandler,
  updateWorkflowHandler,
} from "./workflows.controller"
import {
  createWorkflowSchema,
  listWorkflowRunsQuerySchema,
  listWorkflowVersionsQuerySchema,
  listWorkflowsQuerySchema,
  runWorkflowSchema,
  saveWorkflowGraphSchema,
  updateWorkflowSchema,
  workflowIdParamSchema,
  workflowRunParamSchema,
  workflowVersionParamSchema,
} from "./workflows.dto"

export const workflowsRouter = Router()

workflowsRouter.use(requireAuth, requireVerified)

workflowsRouter.get(
  "/",
  requirePermission("workflow:read"),
  validate(listWorkflowsQuerySchema, "query"),
  asyncHandler(listWorkflowsHandler),
)

workflowsRouter.post(
  "/",
  requireNotRestricted,
  requirePermission("workflow:create"),
  validate(createWorkflowSchema),
  asyncHandler(createWorkflowHandler),
)

workflowsRouter.get(
  "/:id",
  requirePermission("workflow:read"),
  validate(workflowIdParamSchema, "params"),
  asyncHandler(getWorkflowHandler),
)

workflowsRouter.patch(
  "/:id",
  requireNotRestricted,
  requirePermission("workflow:update"),
  validate(workflowIdParamSchema, "params"),
  validate(updateWorkflowSchema),
  asyncHandler(updateWorkflowHandler),
)

workflowsRouter.get(
  "/:id/graph",
  requirePermission("workflow:read"),
  validate(workflowIdParamSchema, "params"),
  asyncHandler(getWorkflowGraphHandler),
)

workflowsRouter.put(
  "/:id/graph",
  requireNotRestricted,
  requirePermission("workflow:update"),
  validate(workflowIdParamSchema, "params"),
  validate(saveWorkflowGraphSchema),
  asyncHandler(saveWorkflowGraphHandler),
)

workflowsRouter.post(
  "/:id/publish",
  requireNotRestricted,
  requirePermission("workflow:update"),
  validate(workflowIdParamSchema, "params"),
  asyncHandler(publishWorkflowHandler),
)

workflowsRouter.post(
  "/:id/run",
  requireNotRestricted,
  requirePermission("workflow:update"),
  validate(workflowIdParamSchema, "params"),
  validate(runWorkflowSchema),
  asyncHandler(runWorkflowHandler),
)

workflowsRouter.get(
  "/:id/runs",
  requirePermission("workflow:read"),
  validate(workflowIdParamSchema, "params"),
  validate(listWorkflowRunsQuerySchema, "query"),
  asyncHandler(listWorkflowRunsHandler),
)

workflowsRouter.get(
  "/:id/runs/:runId",
  requirePermission("workflow:read"),
  validate(workflowRunParamSchema, "params"),
  asyncHandler(getWorkflowRunHandler),
)

workflowsRouter.get(
  "/:id/versions",
  requirePermission("workflow:read"),
  validate(workflowIdParamSchema, "params"),
  validate(listWorkflowVersionsQuerySchema, "query"),
  asyncHandler(listWorkflowVersionsHandler),
)

workflowsRouter.get(
  "/:id/versions/:version",
  requirePermission("workflow:read"),
  validate(workflowVersionParamSchema, "params"),
  asyncHandler(getWorkflowVersionHandler),
)

workflowsRouter.post(
  "/:id/versions/:version/restore",
  requireNotRestricted,
  requirePermission("workflow:update"),
  validate(workflowVersionParamSchema, "params"),
  asyncHandler(restoreWorkflowVersionHandler),
)

workflowsRouter.post(
  "/:id/revert",
  requireNotRestricted,
  requirePermission("workflow:update"),
  validate(workflowIdParamSchema, "params"),
  asyncHandler(revertWorkflowChangesHandler),
)

workflowsRouter.delete(
  "/:id",
  requireNotRestricted,
  requirePermission("workflow:delete"),
  validate(workflowIdParamSchema, "params"),
  asyncHandler(deleteWorkflowHandler),
)
