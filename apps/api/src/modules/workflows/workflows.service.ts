import { AUTH_ERROR, AuthError } from "@cydo/auth"
import mongoose from "mongoose"
import { buildPagination, type PaginationMeta } from "../../setup/response"
import { escapeRegex } from "../../utils/regex"
import { WorkflowModel, toWorkflowDTO, type WorkflowDTO } from "./workflows.model"
import {
  WorkflowGraphModel,
  toWorkflowGraphDTO,
  type GraphNodeAttrs,
  type WorkflowGraphDTO,
} from "./workflows.graph.model"
import {
  WorkflowVersionModel,
  toWorkflowVersionDTO,
  toWorkflowVersionSummaryDTO,
  type WorkflowVersionDTO,
  type WorkflowVersionSummaryDTO,
} from "./workflows.version.model"
import type {
  ListWorkflowVersionsQuery,
  ListWorkflowsQuery,
  SaveWorkflowGraphInput,
} from "./workflows.dto"

export interface WorkflowSlice {
  items: WorkflowDTO[]
  pagination: PaginationMeta
}

export interface WorkflowVersionSlice {
  items: WorkflowVersionSummaryDTO[]
  pagination: PaginationMeta
}

export interface RestoreResult {
  graph: WorkflowGraphDTO
  workflow: WorkflowDTO
}

export class WorkflowsService {
  async create(accountId: string, userId: string, name: string): Promise<WorkflowDTO> {
    const doc = await WorkflowModel.create({
      ownerId: new mongoose.Types.ObjectId(accountId),
      createdBy: new mongoose.Types.ObjectId(userId),
      name,
    })
    return toWorkflowDTO(doc)
  }

  async getById(accountId: string, id: string): Promise<WorkflowDTO> {
    const workflow = await WorkflowModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      ownerId: new mongoose.Types.ObjectId(accountId),
    })

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    return toWorkflowDTO(workflow)
  }

  async rename(accountId: string, id: string, name: string): Promise<WorkflowDTO> {
    const workflow = await WorkflowModel.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        ownerId: new mongoose.Types.ObjectId(accountId),
      },
      { $set: { name } },
      { new: true },
    )

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    return toWorkflowDTO(workflow)
  }

  async list(accountId: string, query: ListWorkflowsQuery): Promise<WorkflowSlice> {
    const filter: Record<string, unknown> = { ownerId: new mongoose.Types.ObjectId(accountId) }
    const search = query.search?.trim()

    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: "i" }
    }

    const { page, limit } = query
    const [docs, total] = await Promise.all([
      WorkflowModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      WorkflowModel.countDocuments(filter),
    ])

    return {
      items: docs.map(toWorkflowDTO),
      pagination: buildPagination(page, limit, total),
    }
  }

  async remove(accountId: string, id: string): Promise<{ id: string }> {
    const result = await WorkflowModel.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      ownerId: new mongoose.Types.ObjectId(accountId),
    })

    if (result.deletedCount === 0) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    await Promise.all([
      WorkflowGraphModel.deleteOne({
        workflowId: new mongoose.Types.ObjectId(id),
        ownerId: new mongoose.Types.ObjectId(accountId),
      }),
      WorkflowVersionModel.deleteMany({
        workflowId: new mongoose.Types.ObjectId(id),
        ownerId: new mongoose.Types.ObjectId(accountId),
      }),
    ])

    return { id }
  }

  async getGraph(accountId: string, workflowId: string): Promise<WorkflowGraphDTO> {
    const ownerObjectId = new mongoose.Types.ObjectId(accountId)
    const workflowObjectId = new mongoose.Types.ObjectId(workflowId)

    const workflow = await WorkflowModel.findOne({
      _id: workflowObjectId,
      ownerId: ownerObjectId,
    })

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    const existing = await WorkflowGraphModel.findOne({
      workflowId: workflowObjectId,
      ownerId: ownerObjectId,
    })

    if (existing) return toWorkflowGraphDTO(existing)

    const created = await WorkflowGraphModel.create({
      workflowId: workflowObjectId,
      ownerId: ownerObjectId,
      nodes: [],
    })

    return toWorkflowGraphDTO(created)
  }

  async saveGraph(
    accountId: string,
    workflowId: string,
    payload: SaveWorkflowGraphInput,
  ): Promise<WorkflowGraphDTO> {
    const ownerObjectId = new mongoose.Types.ObjectId(accountId)
    const workflowObjectId = new mongoose.Types.ObjectId(workflowId)

    const workflow = await WorkflowModel.findOne({
      _id: workflowObjectId,
      ownerId: ownerObjectId,
    })

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    const nodes = payload.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      createdAt: node.createdAt,
      type: node.type,
      configuration: node.configuration ?? {},
      nextNode: node.nextNode,
      position: { x: node.position.x, y: node.position.y },
    }))

    const doc = await WorkflowGraphModel.findOneAndUpdate(
      { workflowId: workflowObjectId, ownerId: ownerObjectId },
      { $set: { nodes } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    if (!doc) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "No se pudo guardar el grafo")
    }

    if ((workflow.status ?? "draft") === "published" && !workflow.hasUnpublishedChanges) {
      await WorkflowModel.updateOne({ _id: workflowObjectId }, { $set: { hasUnpublishedChanges: true } })
    }

    return toWorkflowGraphDTO(doc)
  }

  async publish(accountId: string, userId: string, workflowId: string): Promise<WorkflowDTO> {
    const ownerObjectId = new mongoose.Types.ObjectId(accountId)
    const workflowObjectId = new mongoose.Types.ObjectId(workflowId)

    const workflow = await WorkflowModel.findOne({
      _id: workflowObjectId,
      ownerId: ownerObjectId,
    })

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    const graph = await WorkflowGraphModel.findOne({
      workflowId: workflowObjectId,
      ownerId: ownerObjectId,
    })
    const nodes = (graph?.nodes ?? []) as GraphNodeAttrs[]
    const nextVersion = (workflow.version ?? 0) + 1
    const publishedAt = new Date()

    await WorkflowVersionModel.create({
      workflowId: workflowObjectId,
      ownerId: ownerObjectId,
      version: nextVersion,
      name: workflow.name,
      nodes,
      nodeCount: nodes.length,
      publishedBy: new mongoose.Types.ObjectId(userId),
      publishedAt,
    })

    workflow.status = "published"
    workflow.version = nextVersion
    workflow.publishedAt = publishedAt
    workflow.hasUnpublishedChanges = false
    await workflow.save()

    return toWorkflowDTO(workflow)
  }

  async listVersions(
    accountId: string,
    workflowId: string,
    query: ListWorkflowVersionsQuery,
  ): Promise<WorkflowVersionSlice> {
    const ownerObjectId = new mongoose.Types.ObjectId(accountId)
    const workflowObjectId = new mongoose.Types.ObjectId(workflowId)

    const workflow = await WorkflowModel.findOne({
      _id: workflowObjectId,
      ownerId: ownerObjectId,
    })

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    const filter = { workflowId: workflowObjectId, ownerId: ownerObjectId }
    const { page, limit } = query
    const [docs, total] = await Promise.all([
      WorkflowVersionModel.find(filter)
        .sort({ version: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      WorkflowVersionModel.countDocuments(filter),
    ])

    return {
      items: docs.map(toWorkflowVersionSummaryDTO),
      pagination: buildPagination(page, limit, total),
    }
  }

  async getVersion(
    accountId: string,
    workflowId: string,
    version: number,
  ): Promise<WorkflowVersionDTO> {
    const doc = await WorkflowVersionModel.findOne({
      workflowId: new mongoose.Types.ObjectId(workflowId),
      ownerId: new mongoose.Types.ObjectId(accountId),
      version,
    })

    if (!doc) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Versión no encontrada")
    }

    return toWorkflowVersionDTO(doc)
  }

  async restoreVersion(
    accountId: string,
    workflowId: string,
    version: number,
  ): Promise<RestoreResult> {
    const ownerObjectId = new mongoose.Types.ObjectId(accountId)
    const workflowObjectId = new mongoose.Types.ObjectId(workflowId)

    const workflow = await WorkflowModel.findOne({
      _id: workflowObjectId,
      ownerId: ownerObjectId,
    })

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    const versionDoc = await this.getVersion(accountId, workflowId, version)
    const isPublished = (workflow.status ?? "draft") === "published"
    const differsFromPublished = isPublished && version !== (workflow.version ?? 0)

    return this.applySnapshot(accountId, workflowId, versionDoc.nodes, differsFromPublished)
  }

  async revertChanges(accountId: string, workflowId: string): Promise<RestoreResult> {
    const ownerObjectId = new mongoose.Types.ObjectId(accountId)
    const workflowObjectId = new mongoose.Types.ObjectId(workflowId)

    const workflow = await WorkflowModel.findOne({
      _id: workflowObjectId,
      ownerId: ownerObjectId,
    })

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    const currentVersion = workflow.version ?? 0
    if (currentVersion < 1) {
      throw new AuthError(AUTH_ERROR.VALIDATION, "No hay versiones publicadas")
    }

    const versionDoc = await WorkflowVersionModel.findOne({
      workflowId: workflowObjectId,
      ownerId: ownerObjectId,
      version: currentVersion,
    })

    if (!versionDoc) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Versión no encontrada")
    }

    return this.applySnapshot(
      accountId,
      workflowId,
      versionDoc.nodes as GraphNodeAttrs[],
      false,
    )
  }

  private async applySnapshot(
    accountId: string,
    workflowId: string,
    nodes: GraphNodeAttrs[],
    hasUnpublishedChanges: boolean,
  ): Promise<RestoreResult> {
    const ownerObjectId = new mongoose.Types.ObjectId(accountId)
    const workflowObjectId = new mongoose.Types.ObjectId(workflowId)

    const graph = await WorkflowGraphModel.findOneAndUpdate(
      { workflowId: workflowObjectId, ownerId: ownerObjectId },
      { $set: { nodes } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    if (!graph) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "No se pudo restaurar el grafo")
    }

    const workflow = await WorkflowModel.findOneAndUpdate(
      { _id: workflowObjectId, ownerId: ownerObjectId },
      { $set: { hasUnpublishedChanges } },
      { new: true },
    )

    if (!workflow) {
      throw new AuthError(AUTH_ERROR.USER_NOT_FOUND, "Workflow no encontrado")
    }

    return { graph: toWorkflowGraphDTO(graph), workflow: toWorkflowDTO(workflow) }
  }
}

export const workflowsService = new WorkflowsService()
