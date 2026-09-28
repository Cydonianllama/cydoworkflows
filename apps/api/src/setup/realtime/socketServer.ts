import type { AuthUser } from "@cydo/auth"
import { ACCESS_COOKIE } from "@cydo/auth"
import type { RunData, RunItems } from "@cydo/workflow-pipeline"
import type { Server as HttpServer } from "node:http"
import { Server } from "socket.io"
import { WorkflowModel } from "../../modules/workflows/workflows.model"
import { resolveAccountId } from "../../utils/account"
import { authPorts } from "../container"
import { env } from "../env"

export interface RealtimeRunStarted {
  runId: string
  workflowId: string
  startedAt: string
}

export interface RealtimeNodeStarted {
  runId: string
  nodeId: string
  type: string
  startedAt: string
}

export interface RealtimeNodeFinished {
  runId: string
  nodeId: string
  type: string
  status: string
  startedAt: string
  finishedAt: string
  input: RunItems
  output: RunItems
  error: string | null
}

export interface RealtimeRunFinished {
  runId: string
  workflowId: string
  status: string
  error: string | null
  startedAt: string
  finishedAt: string
  runData: RunData
}

export interface ServerToClientEvents {
  "run:started": (payload: RealtimeRunStarted) => void
  "node:started": (payload: RealtimeNodeStarted) => void
  "node:completed": (payload: RealtimeNodeFinished) => void
  "node:failed": (payload: RealtimeNodeFinished) => void
  "run:finished": (payload: RealtimeRunFinished) => void
}

export interface ClientToServerEvents {
  "workflow:subscribe": (payload: { workflowId: string }) => void
  "workflow:unsubscribe": (payload: { workflowId: string }) => void
}

interface SocketData {
  user: AuthUser
}

/** Vista mínima del servidor para emitir a rooms sin pelear con los tipos de socket.io. */
interface WorkflowEmitter {
  to(room: string): { emit(event: string, payload: unknown): void }
}

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

let io: AppServer | null = null

function workflowRoom(workflowId: string): string {
  return `workflow:${workflowId}`
}

/** Lee una cookie del header `Cookie` del handshake (sin depender de express). */
function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=")
    if (key === name) return decodeURIComponent(rest.join("="))
  }
  return null
}

/**
 * Monta el servidor socket.io sobre el `http.Server` y autentica cada
 * conexión con la cookie de acceso, igual que `requireAuth`.
 */
export function attachRealtime(httpServer: HttpServer): AppServer {
  if (io) return io

  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)

  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    { cors: { origin: allowedOrigins, credentials: true } },
  )

  io.use(async (socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie, ACCESS_COOKIE)
      if (!token) return next(new Error("unauthorized"))

      const payload = authPorts.tokens.verifyAccess(token)
      if (!payload) return next(new Error("unauthorized"))

      const user = await authPorts.users.findById(payload.sub)
      if (!user) return next(new Error("unauthorized"))

      socket.data.user = user
      next()
    } catch {
      next(new Error("unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    socket.on("workflow:subscribe", async ({ workflowId }) => {
      if (typeof workflowId !== "string" || !workflowId) return
      try {
        const exists = await WorkflowModel.exists({
          _id: workflowId,
          ownerId: resolveAccountId(socket.data.user),
        })
        if (!exists) return
        await socket.join(workflowRoom(workflowId))
      } catch {
        // id inválido: se ignora la suscripción
      }
    })

    socket.on("workflow:unsubscribe", ({ workflowId }) => {
      if (typeof workflowId === "string" && workflowId) {
        void socket.leave(workflowRoom(workflowId))
      }
    })
  })

  return io
}

/** Emite un evento a todos los clientes suscritos a un workflow. */
export function emitToWorkflow<K extends keyof ServerToClientEvents>(
  workflowId: string,
  event: K,
  payload: Parameters<ServerToClientEvents[K]>[0],
): void {
  const emitter = io as unknown as WorkflowEmitter | null
  emitter?.to(workflowRoom(workflowId)).emit(event, payload)
}

export function closeRealtime(): void {
  io?.close()
  io = null
}
