import { AUTH_ERROR, AuthError } from "@cydo/auth"
import type { RunItems, RunResult, TriggerKind } from "@cydo/workflow-pipeline"
import mongoose from "mongoose"
import { cronScheduler, pipelineRunner, runPersistence } from "../../setup/container"
import { createRealtimeRunEvents, mergeRunEvents } from "../../setup/realtime/runEvents"
import type { GraphNodeAttrs } from "./workflows.graph.model"
import { WorkflowModel } from "./workflows.model"
import { WorkflowVersionModel } from "./workflows.version.model"

const MANUAL_TRIGGER_TYPE = "node:triggeronclick"

export interface WorkflowTriggerInput {
  kind: TriggerKind
  nodeId: string
  payload?: unknown
}

export interface WorkflowExecutionParams {
  ownerId: string
  workflowId: string
  version?: number
  trigger: WorkflowTriggerInput
  inputData?: RunItems
}

export interface StartedWorkflowRun {
  runId: string
}

export interface WorkflowExecutionResult extends RunResult {
  runId: string
}

interface PreparedWorkflowRun {
  runId: string
  workflowId: string
  version: number
  trigger: { kind: TriggerKind; nodeId: string; payload?: unknown }
  inputData: RunItems
  nodes: GraphNodeAttrs[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Normaliza cualquier payload a items al estilo n8n. */
function toRunItems(payload: unknown): RunItems {
  if (Array.isArray(payload)) {
    return payload.map((item) => ({ json: isRecord(item) ? item : { value: item } }))
  }
  if (isRecord(payload)) return [{ json: payload }]
  return [{ json: {} }]
}

function toPipelineNode(node: GraphNodeAttrs) {
  return { id: node.id, type: node.type, configuration: node.configuration, nextNode: node.nextNode }
}

async function loadPublishedNodes(
  ownerId: string,
  workflowId: string,
  version: number,
): Promise<GraphNodeAttrs[]> {
  const doc = await WorkflowVersionModel.findOne({
    workflowId: new mongoose.Types.ObjectId(workflowId),
    ownerId: new mongoose.Types.ObjectId(ownerId),
    version,
  }).lean()

  if (!doc) {
    throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Versión no encontrada")
  }

  return doc.nodes as GraphNodeAttrs[]
}

/**
 * Valida el workflow publicado, resuelve el nodo de entrada y crea el
 * `WorkflowRun` (status `running`) con su `inputData` inicial.
 */
async function prepareWorkflowRun(params: WorkflowExecutionParams): Promise<PreparedWorkflowRun> {
  const workflow = await WorkflowModel.findOne({
    _id: new mongoose.Types.ObjectId(params.workflowId),
    ownerId: new mongoose.Types.ObjectId(params.ownerId),
  }).lean()

  if (!workflow) {
    throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
  }

  if ((workflow.status ?? "draft") !== "published") {
    throw new AuthError(AUTH_ERROR.VALIDATION, "El workflow no está publicado")
  }

  const version = params.version ?? workflow.version ?? 0
  if (version < 1) {
    throw new AuthError(AUTH_ERROR.VALIDATION, "El workflow no tiene versiones publicadas")
  }

  const nodes = await loadPublishedNodes(params.ownerId, params.workflowId, version)

  let nodeId = params.trigger.nodeId
  if (!nodeId && params.trigger.kind === "manual") {
    nodeId = nodes.find((node) => node.type === MANUAL_TRIGGER_TYPE)?.id ?? ""
  }
  if (!nodeId) {
    throw new AuthError(AUTH_ERROR.VALIDATION, "No se pudo determinar el nodo de entrada")
  }
  if (!nodes.some((node) => node.id === nodeId)) {
    throw new AuthError(AUTH_ERROR.VALIDATION, `Nodo de entrada ${nodeId} no encontrado`)
  }

  const inputData = params.inputData ?? toRunItems(params.trigger.payload)
  const runId = await runPersistence.createRun({
    workflowId: params.workflowId,
    ownerId: params.ownerId,
    version,
    trigger: { kind: params.trigger.kind, nodeId },
    inputData,
  })

  return {
    runId,
    workflowId: params.workflowId,
    version,
    trigger: { kind: params.trigger.kind, nodeId, payload: params.trigger.payload },
    inputData,
    nodes,
  }
}

/**
 * Recorre la versión publicada con el pipeline. Los eventos del run se
 * persisten en MongoDB y se emiten por socket.io a la room del workflow.
 */
async function runWorkflowExecution(prepared: PreparedWorkflowRun): Promise<RunResult> {
  return pipelineRunner.run(
    {
      nodes: prepared.nodes.map(toPipelineNode),
      startNodeId: prepared.trigger.nodeId,
      context: {
        workflowId: prepared.workflowId,
        version: prepared.version,
        trigger: prepared.trigger,
        inputData: prepared.inputData,
      },
    },
    mergeRunEvents(
      runPersistence.createEvents(prepared.runId),
      createRealtimeRunEvents(prepared.runId, prepared.workflowId),
    ),
  )
}

/**
 * Dispara la ejecución en segundo plano: responde el `runId` apenas se crea
 * el run y el avance llega por socket.io.
 */
export async function startWorkflowRun(
  params: WorkflowExecutionParams,
): Promise<StartedWorkflowRun> {
  const prepared = await prepareWorkflowRun(params)
  void runWorkflowExecution(prepared).catch((error: unknown) => {
    console.error("[api] falló la ejecución del workflow", error)
  })
  return { runId: prepared.runId }
}

/**
 * Ejecuta y espera el resultado completo (uso interno/tests).
 */
export async function executeWorkflow(
  params: WorkflowExecutionParams,
): Promise<WorkflowExecutionResult> {
  const prepared = await prepareWorkflowRun(params)
  const result = await runWorkflowExecution(prepared)
  return { runId: prepared.runId, ...result }
}

export function startWorkflowRuntime(): void {
  cronScheduler.setHandler(async (registration) => {
    await startWorkflowRun({
      ownerId: registration.ownerId,
      workflowId: registration.workflowId,
      version: registration.version,
      trigger: { kind: "cron", nodeId: registration.nodeId },
    })
  })
  cronScheduler.start()
}

export function stopWorkflowRuntime(): void {
  cronScheduler.stop()
}
