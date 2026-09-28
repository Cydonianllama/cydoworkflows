import { io, type Socket } from "socket.io-client"
import { env } from "./env"

export type RunStatus = "success" | "failed" | "limit" | "cancelled"

export interface RunStartedEvent {
  runId: string
  workflowId: string
  startedAt: string
}

export interface NodeStartedEvent {
  runId: string
  nodeId: string
  type: string
  startedAt: string
}

export interface NodeFinishedEvent {
  runId: string
  nodeId: string
  type: string
  status: "success" | "error" | "skipped"
  startedAt: string
  finishedAt: string
  input: unknown[]
  output: unknown[]
  error: string | null
}

export interface RunFinishedEvent {
  runId: string
  workflowId: string
  status: RunStatus
  error: string | null
  startedAt: string
  finishedAt: string
  runData: Record<string, unknown[]>
}

export interface ServerToClientEvents {
  "run:started": (payload: RunStartedEvent) => void
  "node:started": (payload: NodeStartedEvent) => void
  "node:completed": (payload: NodeFinishedEvent) => void
  "node:failed": (payload: NodeFinishedEvent) => void
  "run:finished": (payload: RunFinishedEvent) => void
}

export interface ClientToServerEvents {
  "workflow:subscribe": (payload: { workflowId: string }) => void
  "workflow:unsubscribe": (payload: { workflowId: string }) => void
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

/** Conexión única de la app; se autentica con las cookies de sesión. */
export const socket: AppSocket = io(env.VITE_SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
})

export function connectSocket(): void {
  if (!socket.connected) socket.connect()
}

export function disconnectSocket(): void {
  if (socket.connected) socket.disconnect()
}

export function subscribeWorkflow(workflowId: string): void {
  connectSocket()
  socket.emit("workflow:subscribe", { workflowId })
}

export function unsubscribeWorkflow(workflowId: string): void {
  socket.emit("workflow:unsubscribe", { workflowId })
}
