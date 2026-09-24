import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import { webhookInboxHandler } from "./webhooks.controller"

export const webhooksRouter = Router()

webhooksRouter.post("/:token", asyncHandler(webhookInboxHandler))
