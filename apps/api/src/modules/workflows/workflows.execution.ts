import { AUTH_ERROR, AuthError } from "@cydo/auth"
import type { RunResult, TriggerKind } from "@cydo/workflow-pipeline"
import mongoose from "mongoose"
import { cronScheduler, pipelineRunner, runPersistence } from "../../setup/container"
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
}

export interface WorkflowExecutionResult extends RunResult {
  runId: string
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
 * Ejecuta la versión publicada de un workflow desde el nodo de entrada.
 * Es el punto donde convergen engine (triggers) y pipeline (recorrido):
 * carga los nodos publicados y se los inyecta al runner.
 */
export async function executeWorkflow(params: WorkflowExecutionParams): Promise<WorkflowExecutionResult> {
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

  const runId = await runPersistence.createRun({
    workflowId: params.workflowId,
    ownerId: params.ownerId,
    version,
    trigger: { kind: params.trigger.kind, nodeId },
  })

  const result = await pipelineRunner.run(
    {
      nodes: nodes.map(toPipelineNode),
      startNodeId: nodeId,
      context: {
        workflowId: params.workflowId,
        version,
        trigger: { kind: params.trigger.kind, nodeId, payload: params.trigger.payload },
        variables: {},
      },
    },
    runPersistence.createEvents(runId),
  )

  return { runId, ...result }
}

export function startWorkflowRuntime(): void {
  cronScheduler.setHandler(async (registration) => {
    await executeWorkflow({
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
