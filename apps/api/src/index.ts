import { API_PREFIX, createApp } from "./setup/app"
import { connectDb, disconnectDb } from "./setup/db"
import { env } from "./setup/env"
import { startWorkflowRuntime, stopWorkflowRuntime } from "./modules/workflows/workflows.execution"

async function bootstrap(): Promise<void> {
  await connectDb()
  startWorkflowRuntime()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    console.log(`[api] escuchando en http://localhost:${env.PORT}${API_PREFIX}`)
  })

  const shutdown = (signal: string): void => {
    console.log(`[api] ${signal} recibido, cerrando...`)
    stopWorkflowRuntime()
    server.close(() => {
      void disconnectDb().finally(() => process.exit(0))
    })
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on("SIGINT", () => shutdown("SIGINT"))
  process.on("SIGTERM", () => shutdown("SIGTERM"))
}

void bootstrap().catch((error: unknown) => {
  console.error("[api] falló el arranque", error)
  process.exit(1)
})
