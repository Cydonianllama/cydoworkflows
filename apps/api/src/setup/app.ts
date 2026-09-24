import cookieParser from "cookie-parser"
import cors from "cors"
import express, { type Express } from "express"
import helmet from "helmet"
import { errorHandler, notFound } from "../middleware/errorHandler"
import { authRouter } from "../modules/auth/auth.routes"
import { invitesRouter, membersRouter } from "../modules/members/members.routes"
import { onboardingRouter } from "../modules/onboarding/onboarding.routes"
import { usersRouter } from "../modules/users/users.routes"
import { workflowsRouter } from "../modules/workflows/workflows.routes"
import { webhooksRouter } from "../modules/webhooks/webhooks.routes"
import { env } from "./env"

export const API_PREFIX = "/api/v1"

export function createApp(): Express {
  const app = express()

  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.disable("x-powered-by")
  app.use(helmet())
  app.use(cors({ origin: allowedOrigins, credentials: true }))
  app.use(express.json({ limit: "1mb" }))
  app.use(cookieParser())

  app.get("/health", (_req, res) => {
    res.json({ status: true, data: { uptime: process.uptime() } })
  })

  app.use("/hooks", webhooksRouter)

  const api = express.Router()
  api.use("/auth", authRouter)
  api.use("/onboarding", onboardingRouter)
  api.use("/invites", invitesRouter)
  api.use("/members", membersRouter)
  api.use("/users", usersRouter)
  api.use("/workflows", workflowsRouter)

  app.use(API_PREFIX, api)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
