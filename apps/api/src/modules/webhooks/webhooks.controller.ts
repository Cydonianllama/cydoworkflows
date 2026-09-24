import type { Request, Response } from "express"
import { sendOk } from "../../setup/response"
import { workflowEngine } from "../../setup/container"
import { executeWorkflow } from "../workflows/workflows.execution"

export async function webhookInboxHandler(req: Request, res: Response): Promise<void> {
  const { token } = req.params as { token: string }
  const registration = await workflowEngine.resolveWebhook(token)

  const result = await executeWorkflow({
    ownerId: registration.ownerId,
    workflowId: registration.workflowId,
    version: registration.version,
    trigger: {
      kind: "webhook",
      nodeId: registration.nodeId,
      payload: req.body ?? {},
    },
  })

  sendOk(res, result, "Workflow ejecutado")
}
