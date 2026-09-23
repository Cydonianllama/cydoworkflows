import { Router } from "express"
import { requireAuth } from "../../middleware/requireAuth"
import { validate } from "../../middleware/validate"
import { asyncHandler } from "../../utils/asyncHandler"
import { getMeHandler, updateMeHandler } from "./users.controller"
import { updateProfileSchema } from "./users.dto"

export const usersRouter = Router()

usersRouter.use(requireAuth)

usersRouter.get("/me", asyncHandler(getMeHandler))
usersRouter.patch("/me", validate(updateProfileSchema), asyncHandler(updateMeHandler))
