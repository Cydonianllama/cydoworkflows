import { AUTH_ERROR, AuthError } from "@cydo/auth"
import type { Request, Response } from "express"
import { resolveAccountId } from "../../utils/account"
import { sendCreated, sendList, sendOk } from "../../setup/response"
import { workflowsService } from "./workflows.service"
import type {
  ListWorkflowVersionsQuery,
  ListWorkflowsQuery,
  SaveWorkflowGraphInput,
} from "./workflows.dto"

function currentUser(req: Request) {
  if (!req.user) throw new AuthError(AUTH_ERROR.INVALID_TOKEN, "No hay sesión activa")
  return req.user
}

export async function createWorkflowHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const workflow = await workflowsService.create(resolveAccountId(user), user.id, (req.body as { name: string }).name)
  sendCreated(res, { workflow })
}

export async function getWorkflowHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const workflow = await workflowsService.getById(resolveAccountId(user), id)
  sendOk(res, { workflow })
}

export async function updateWorkflowHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const { name } = req.body as { name: string }
  const workflow = await workflowsService.rename(resolveAccountId(user), id, name)
  sendOk(res, { workflow }, "Workflow actualizado")
}

export async function listWorkflowsHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const query = req.query as unknown as ListWorkflowsQuery
  const { items, pagination } = await workflowsService.list(resolveAccountId(user), query)
  sendList(res, items, pagination)
}

export async function deleteWorkflowHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const deleted = await workflowsService.remove(resolveAccountId(user), id)
  sendOk(res, deleted, "Workflow eliminado")
}

export async function getWorkflowGraphHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const graph = await workflowsService.getGraph(resolveAccountId(user), id)
  sendOk(res, { graph })
}

export async function saveWorkflowGraphHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const payload = req.body as SaveWorkflowGraphInput
  const graph = await workflowsService.saveGraph(resolveAccountId(user), id, payload)
  sendOk(res, { graph }, "Grafo guardado")
}

export async function publishWorkflowHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const workflow = await workflowsService.publish(resolveAccountId(user), user.id, id)
  sendOk(res, { workflow }, "Workflow publicado")
}

export async function listWorkflowVersionsHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const query = req.query as unknown as ListWorkflowVersionsQuery
  const { items, pagination } = await workflowsService.listVersions(
    resolveAccountId(user),
    id,
    query,
  )
  sendList(res, items, pagination)
}

export async function getWorkflowVersionHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id, version } = req.params as { id: string; version: string }
  const versionDoc = await workflowsService.getVersion(
    resolveAccountId(user),
    id,
    Number(version),
  )
  sendOk(res, { version: versionDoc })
}

export async function restoreWorkflowVersionHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id, version } = req.params as { id: string; version: string }
  const result = await workflowsService.restoreVersion(resolveAccountId(user), id, Number(version))
  sendOk(res, result, "Versión restaurada")
}

export async function revertWorkflowChangesHandler(req: Request, res: Response): Promise<void> {
  const user = currentUser(req)
  const { id } = req.params as { id: string }
  const result = await workflowsService.revertChanges(resolveAccountId(user), id)
  sendOk(res, result, "Cambios revertidos")
}
