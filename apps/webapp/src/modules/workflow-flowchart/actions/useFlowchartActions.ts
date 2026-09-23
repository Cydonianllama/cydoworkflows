import { useCallback } from "react"
import { toast } from "sonner"
import type { Node } from "@xyflow/react"
import {
  getWorkflowGraphRequest,
  getWorkflowRequest,
  listWorkflowVersionsRequest,
  publishWorkflowRequest,
  restoreWorkflowVersionRequest,
  revertWorkflowRequest,
  saveWorkflowGraphRequest,
  updateWorkflowRequest,
  type GraphNodeDTO,
  type RestoreWorkflowResponseDTO,
  type WorkflowVersionSummaryDTO,
} from "@/lib/api/workflows"
import { eventBus } from "@/lib/eventBus/eventBus"
import { errorMessage } from "@/utils/error"
import type { FlowchartRfNode, INode, NoteConfiguration } from "../nodes/types"
import { readNoteConfiguration } from "../nodes/note/noteNode"
import { useFlowchartStore } from "../store"
import { nodesToEdges } from "../utils/nodesToEdges"

function rfNodeToGraphNode(node: Node): GraphNodeDTO | null {
  const data = node.data as { node?: INode } | undefined
  const domain = data?.node
  if (!domain) return null

  let configuration: unknown = domain.configuration

  if (domain.type === "node:note") {
    const noteConfig = readNoteConfiguration(domain.configuration)
    configuration = {
      ...noteConfig,
      width: node.width ?? noteConfig.width,
      height: node.height ?? noteConfig.height,
    }
  }

  return {
    id: domain.id,
    title: domain.title,
    createdAt: domain.createdAt,
    type: domain.type,
    configuration,
    nextNode: domain.nextNode,
    position: { x: node.position.x, y: node.position.y },
  }
}

function graphNodeToRfNode(node: GraphNodeDTO): FlowchartRfNode {
  const base: FlowchartRfNode = {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      node: {
        id: node.id,
        title: node.title,
        createdAt: node.createdAt,
        type: node.type,
        configuration: node.configuration,
        nextNode: node.nextNode,
      },
    },
  }

  if (node.type === "node:note") {
    const noteConfig = readNoteConfiguration(
      node.configuration as NoteConfiguration | undefined,
    )
    return {
      ...base,
      zIndex: -1,
      connectable: false,
      width: noteConfig.width,
      height: noteConfig.height,
    }
  }

  return base
}

export const useFlowchartActions = () => {
  const {
    workflowId,
    nodes,
    loading,
    dirty,
    setWorkflowName,
    setWorkflowMeta,
    setPublishing,
    setNodes,
    setEdges,
    setLoading,
    markSaved,
  } = useFlowchartStore()

  const loadWorkflowAction = useCallback(async () => {
    if (!workflowId) return

    try {
      const req = await getWorkflowRequest(workflowId)

      if (!req) {
        toast.error("Error al cargar el workflow")
        return
      }

      if (!req.status) {
        toast.error(req.message ?? "Error al cargar el workflow")
        return
      }

      if (!req.data?.workflow) {
        toast.error("Respuesta inesperada del servidor")
        return
      }

      const { workflow } = req.data
      setWorkflowName(workflow.name)
      setWorkflowMeta({
        status: workflow.status,
        version: workflow.version,
        publishedAt: workflow.publishedAt,
        hasUnpublishedChanges: workflow.hasUnpublishedChanges,
      })
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (LoadWorkflowAction)"))
    }
  }, [workflowId, setWorkflowName, setWorkflowMeta])

  const renameWorkflowAction = useCallback(
    async (name: string) => {
      if (!workflowId) return false

      const trimmed = name.trim()
      if (!trimmed) {
        toast.error("El nombre es obligatorio")
        return false
      }

      try {
        const req = await updateWorkflowRequest(workflowId, { name: trimmed })

        if (!req) {
          toast.error("No pudimos guardar el nombre")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "No pudimos guardar el nombre")
          return false
        }

        if (!req.data?.workflow) {
          toast.error("Respuesta inesperada del servidor")
          return false
        }

        setWorkflowName(req.data.workflow.name)
        toast.success("Nombre guardado")
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (RenameWorkflowAction)"))
        return false
      }
    },
    [workflowId, setWorkflowName],
  )

  const loadGraphAction = useCallback(async () => {
    if (!workflowId) return

    try {
      setLoading(true)

      const req = await getWorkflowGraphRequest(workflowId)

      if (!req) {
        toast.error("Error al cargar el grafo")
        return
      }

      if (!req.status) {
        toast.error(req.message ?? "Error al cargar el grafo")
        return
      }

      if (!req.data?.graph) {
        toast.error("Respuesta inesperada del servidor")
        return
      }

      const { graph } = req.data
      const nextNodes = graph.nodes.map(graphNodeToRfNode)
      setNodes(nextNodes)
      setEdges(nodesToEdges(nextNodes))
      markSaved()
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (LoadGraphAction)"))
    } finally {
      setLoading(false)
    }
  }, [workflowId, setLoading, setNodes, setEdges, markSaved])

  const saveGraphAction = useCallback(async () => {
    if (!workflowId) return false
    if (!dirty) return false

    try {
      setLoading(true)

      const graphNodes = nodes.map(rfNodeToGraphNode).filter((node): node is GraphNodeDTO => node !== null)

      const req = await saveWorkflowGraphRequest(workflowId, {
        nodes: graphNodes,
      })

      if (!req) {
        toast.error("No pudimos guardar el grafo")
        return false
      }

      if (!req.status) {
        toast.error(req.message ?? "No pudimos guardar el grafo")
        return false
      }

      if (!req.data?.graph) {
        toast.error("Respuesta inesperada del servidor")
        return false
      }

      markSaved()
      eventBus.emit("workflow.graph.saved", {
        workflowId,
        nodeCount: graphNodes.length,
      })
      return true
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (SaveGraphAction)"))
      return false
    } finally {
      setLoading(false)
    }
  }, [workflowId, nodes, dirty, setLoading, markSaved])

  const publishWorkflowAction = useCallback(async () => {
    if (!workflowId) return false

    try {
      setPublishing(true)

      if (dirty) {
        const saved = await saveGraphAction()
        if (!saved) return false
      }

      const req = await publishWorkflowRequest(workflowId)

      if (!req) {
        toast.error("No pudimos publicar el workflow")
        return false
      }

      if (!req.status) {
        toast.error(req.message ?? "No pudimos publicar el workflow")
        return false
      }

      if (!req.data?.workflow) {
        toast.error("Respuesta inesperada del servidor")
        return false
      }

      const { workflow } = req.data
      setWorkflowMeta({
        status: workflow.status,
        version: workflow.version,
        publishedAt: workflow.publishedAt,
        hasUnpublishedChanges: workflow.hasUnpublishedChanges,
      })
      markSaved()
      toast.success(`Publicado v${workflow.version}`)
      eventBus.emit("workflow.published", {
        workflowId,
        version: workflow.version,
      })
      return true
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (PublishWorkflowAction)"))
      return false
    } finally {
      setPublishing(false)
    }
  }, [workflowId, dirty, saveGraphAction, setPublishing, setWorkflowMeta, markSaved])

  const listVersionsAction = useCallback(async (): Promise<WorkflowVersionSummaryDTO[] | null> => {
    if (!workflowId) return null

    try {
      const req = await listWorkflowVersionsRequest(workflowId, { page: 1, limit: 50 })

      if (!req) {
        toast.error("Error al cargar las versiones")
        return null
      }

      if (!req.status) {
        toast.error(req.message ?? "Error al cargar las versiones")
        return null
      }

      return req.data?.items ?? []
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (ListVersionsAction)"))
      return null
    }
  }, [workflowId])

  const applyRestoredGraph = useCallback(
    (result: RestoreWorkflowResponseDTO) => {
      const nextNodes = result.graph.nodes.map(graphNodeToRfNode)
      setNodes(nextNodes)
      setEdges(nodesToEdges(nextNodes))
      markSaved()
      setWorkflowMeta(result.workflow)
    },
    [setNodes, setEdges, markSaved, setWorkflowMeta],
  )

  const restoreVersionAction = useCallback(
    async (version: number) => {
      if (!workflowId) return false

      try {
        setLoading(true)

        const req = await restoreWorkflowVersionRequest(workflowId, version)

        if (!req) {
          toast.error("No pudimos restaurar la versión")
          return false
        }

        if (!req.status) {
          toast.error(req.message ?? "No pudimos restaurar la versión")
          return false
        }

        if (!req.data?.graph || !req.data?.workflow) {
          toast.error("Respuesta inesperada del servidor")
          return false
        }

        applyRestoredGraph(req.data)
        toast.success(`Versión v${version} restaurada`)
        return true
      } catch (error) {
        toast.error(errorMessage(error, "Error inesperado (RestoreVersionAction)"))
        return false
      } finally {
        setLoading(false)
      }
    },
    [workflowId, setLoading, applyRestoredGraph],
  )

  const revertChangesAction = useCallback(async () => {
    if (!workflowId) return false

    try {
      setLoading(true)

      const req = await revertWorkflowRequest(workflowId)

      if (!req) {
        toast.error("No pudimos revertir los cambios")
        return false
      }

      if (!req.status) {
        toast.error(req.message ?? "No pudimos revertir los cambios")
        return false
      }

      if (!req.data?.graph || !req.data?.workflow) {
        toast.error("Respuesta inesperada del servidor")
        return false
      }

      applyRestoredGraph(req.data)
      toast.success("Cambios revertidos")
      return true
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (RevertChangesAction)"))
      return false
    } finally {
      setLoading(false)
    }
  }, [workflowId, setLoading, applyRestoredGraph])

  return {
    loadWorkflowAction,
    renameWorkflowAction,
    loadGraphAction,
    saveGraphAction,
    publishWorkflowAction,
    listVersionsAction,
    restoreVersionAction,
    revertChangesAction,
    loading,
    dirty,
    nodes,
  }
}
