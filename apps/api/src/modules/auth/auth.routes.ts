import { googleLoginSchema, loginSchema, registerSchema, resendOtpSchema, verifyOtpSchema } from "@cydo/auth"
import { Router } from "express"
import { requireAuth } from "../../middleware/requireAuth"
import { validate } from "../../middleware/validate"
import { asyncHandler } from "../../utils/asyncHandler"
import {
  googleHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
  resendOtpHandler,
  verifyOtpHandler,
} from "./auth.controller"

export const authRouter = Router()

authRouter.post("/register", validate(registerSchema), asyncHandler(registerHandler))
authRouter.post("/verify-otp", validate(verifyOtpSchema), asyncHandler(verifyOtpHandler))
authRouter.post("/resend-otp", validate(resendOtpSchema), asyncHandler(resendOtpHandler))
authRouter.post("/login", validate(loginSchema), asyncHandler(loginHandler))
authRouter.post("/google", validate(googleLoginSchema), asyncHandler(googleHandler))
authRouter.post("/refresh", asyncHandler(refreshHandler))
authRouter.post("/logout", asyncHandler(logoutHandler))
authRouter.get("/me", requireAuth, meHandler)
