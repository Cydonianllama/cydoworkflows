import type { RunEvents, RunResult, TriggerKind } from "@cydo/workflow-pipeline"
import mongoose from "mongoose"
import {
  WorkflowRunModel,
  type WorkflowRunStatus,
} from "../../modules/workflows/workflows.run.model"

export interface CreateRunInput {
  workflowId: string
  ownerId: string
  version: number
  trigger: { kind: TriggerKind; nodeId: string }
}

const STATUS_BY_RESULT: Record<RunResult["status"], WorkflowRunStatus> = {
  success: "success",
  failed: "failed",
  limit: "limit",
  cancelled: "cancelled",
}

/**
 * Implementa los eventos del pipeline persistiendo cada paso en `WorkflowRun`.
 */
export class RunPersistenceAdapter {
  async createRun(input: CreateRunInput): Promise<string> {
    const doc = await WorkflowRunModel.create({
      workflowId: new mongoose.Types.ObjectId(input.workflowId),
      ownerId: new mongoose.Types.ObjectId(input.ownerId),
      version: input.version,
      trigger: input.trigger,
      status: "running",
      steps: [],
      error: null,
      startedAt: new Date(),
      finishedAt: null,
    })
    return doc._id.toString()
  }

  createEvents(runId: string): RunEvents {
    const objectId = new mongoose.Types.ObjectId(runId)
    return {
      onNodeComplete: async (step) => {
        await WorkflowRunModel.updateOne({ _id: objectId }, { $push: { steps: step } })
      },
      onNodeError: async (step) => {
        await WorkflowRunModel.updateOne({ _id: objectId }, { $push: { steps: step } })
      },
      onRunFinish: async (result) => {
        await WorkflowRunModel.updateOne(
          { _id: objectId },
          {
            $set: {
              status: STATUS_BY_RESULT[result.status],
              steps: result.steps,
              error: result.error,
              finishedAt: result.finishedAt,
            },
          },
        )
      },
    }
  }
}
