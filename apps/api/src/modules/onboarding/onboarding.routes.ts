import { completeOnboardingSchema } from "@cydo/auth"
import { Router } from "express"
import { requireAuth } from "../../middleware/requireAuth"
import { requireVerified } from "../../middleware/requireVerified"
import { validate } from "../../middleware/validate"
import { asyncHandler } from "../../utils/asyncHandler"
import { completeOnboardingHandler } from "./onboarding.controller"

export const onboardingRouter = Router()

onboardingRouter.post(
  "/complete",
  requireAuth,
  requireVerified,
  validate(completeOnboardingSchema),
  asyncHandler(completeOnboardingHandler),
)
