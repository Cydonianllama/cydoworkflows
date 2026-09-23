import "@xyflow/react/dist/style.css"
import { Copy, Lock, PanelRight, Plus, StickyNote, Trash2, Unlock } from "lucide-react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react"
import { useTheme } from "@/features/theme/ThemeProvider"
import { Button } from "@/components/ui/button"
import { FlowchartCanvas } from "../components/FlowchartCanvas/FlowchartCanvas"
import { ExecuteFlowButton } from "../components/ExecuteFlowButton/ExecuteFlowButton"
import type { ExecuteFlowTriggerItem } from "../components/ExecuteFlowButton/executeFlowButtonProps"
import { NodePalette } from "../components/NodePalette/NodePalette"
import type { NodePaletteItem } from "../components/NodePalette/nodePaletteProps"
import { NodeDialog } from "../components/NodeDialog/NodeDialog"
import type { NodeDialogNodeInfo } from "../components/NodeDialog/nodeDialogProps"
import { NoteDialog } from "../components/NoteDialog/NoteDialog"
import { FlowchartContextMenu } from "../components/FlowchartContextMenu/FlowchartContextMenu"
import type { ContextMenuItem } from "../components/FlowchartContextMenu/contextMenuProps"
import { useFlowchartInitialLoad } from "../hooks/useFlowchartInitialLoad"
import { useGraphAutoSave } from "../hooks/useGraphAutoSave"
import { useFlowExecution } from "../hooks/useFlowExecution"
import { getNodeDefinition, getOutgoingEdges, listNodeDefinitions } from "../nodes"
import { readNoteConfiguration } from "../nodes/note/noteNode"
import type { FlowchartNodeType, FlowchartRfNode, INode, NoteColor } from "../nodes/types"
import { useFlowchartStore } from "../store"
import { nodesToEdges } from "../utils/nodesToEdges"
import { duplicateNodes } from "../utils/duplicateNodes"

interface ContextMenuState {
  x: number
  y: number
  nodeId?: string
}

function createFlowNode(type: FlowchartNodeType, position: { x: number; y: number }): FlowchartRfNode | null {
  const definition = getNodeDefinition(type)
  if (!definition) return null

  const domainNode: INode = {
    id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: definition.defaultTitle,
    createdAt: new Date().toISOString(),
    type: definition.type,
    configuration: structuredClone(definition.defaultConfiguration),
    nextNode: "",
  }

  const isNote = domainNode.type === "node:note"
  const noteConfig = isNote ? readNoteConfiguration(domainNode.configuration) : null

  return {
    id: domainNode.id,
    type: domainNode.type,
    position,
    data: { node: domainNode },
    ...(isNote
      ? {
          zIndex: -1,
          connectable: false,
          width: noteConfig?.width,
          height: noteConfig?.height,
        }
      : {}),
  }
}

function toDialogInfo(rfNode: Node | undefined): NodeDialogNodeInfo | null {
  if (!rfNode) return null
  const domain = (rfNode.data as { node?: INode }).node
  if (!domain) return null
  return { id: domain.id, title: domain.title, type: domain.type }
}

function findPrevInfo(selectedId: string, nodes: Node[]): NodeDialogNodeInfo | null {
  for (const rfNode of nodes) {
    const domain = (rfNode.data as { node?: INode }).node
    if (!domain) continue
    if (getOutgoingEdges(domain).some((edge) => edge.target === selectedId)) {
      return toDialogInfo(rfNode)
    }
  }

  return null
}

function findNextInfo(selectedId: string, nodes: Node[]): NodeDialogNodeInfo | null {
  const selectedRf = nodes.find((node) => node.id === selectedId)
  const selectedDomain = (selectedRf?.data as { node?: INode } | undefined)?.node
  if (!selectedDomain) return null

  for (const edge of getOutgoingEdges(selectedDomain)) {
    const nextRf = nodes.find((node) => node.id === edge.target)
    const info = toDialogInfo(nextRf)
    if (info) return info
  }

  return null
}

export function FlowchartComposition(props: { workflowId: string }) {
  return (
    <ReactFlowProvider>
      <FlowchartCompositionInner {...props} />
    </ReactFlowProvider>
  )
}

function FlowchartCompositionInner({ workflowId }: { workflowId: string }) {
  const { nodes, edges, setWorkflowId, setNodes, setEdges, addNode, markDirty } =
    useFlowchartStore()
  const { resolvedTheme } = useTheme()
  const { screenToFlowPosition } = useReactFlow()
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [pendingAddPosition, setPendingAddPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const { running: executing, activeNodeId, start: startExecution, stop: stopExecution } =
    useFlowExecution(nodes)

  useFlowchartInitialLoad()
  useGraphAutoSave()

  useEffect(() => {
    setWorkflowId(workflowId)
  }, [workflowId, setWorkflowId])

  const paletteItems: NodePaletteItem[] = useMemo(
    () =>
      listNodeDefinitions()
        .filter((definition) => definition.type !== "node:note")
        .map((definition) => ({
          type: definition.type,
          title: definition.defaultTitle,
          description: definition.description,
          Icon: definition.Icon,
          category: definition.category,
        })),
    [],
  )

  const onClickTriggers: ExecuteFlowTriggerItem[] = useMemo(
    () =>
      nodes
        .map((rfNode) => {
          const domain = (rfNode.data as { node?: INode } | undefined)?.node
          if (!domain || domain.type !== "node:triggeronclick") return null
          const definition = getNodeDefinition(domain.type)
          if (!definition) return null
          return {
            id: domain.id,
            title: domain.title || definition.defaultTitle,
            Icon: definition.Icon,
          } satisfies ExecuteFlowTriggerItem
        })
        .filter((item): item is ExecuteFlowTriggerItem => item !== null),
    [nodes],
  )

  useEffect(() => {
    if (onClickTriggers.length === 0 && executing) {
      stopExecution()
    }
  }, [onClickTriggers.length, executing, stopExecution])

  const executingEdgeIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>()
    const ids = new Set<string>()
    for (const edge of edges) {
      if (edge.source === activeNodeId || edge.target === activeNodeId) {
        ids.add(edge.id)
      }
    }
    return ids
  }, [edges, activeNodeId])

  const handleExecuteTrigger = useCallback(
    (triggerId: string) => {
      if (executing) return
      void startExecution(triggerId)
    },
    [executing, startExecution],
  )

  const handleAddNode = useCallback(
    (type: FlowchartNodeType) => {
      stopExecution()
      const position =
        pendingAddPosition ??
        (() => {
          const container = canvasContainerRef.current
          return container
            ? screenToFlowPosition({
                x: container.getBoundingClientRect().left + container.clientWidth / 2,
                y: container.getBoundingClientRect().top + container.clientHeight / 2,
              })
            : screenToFlowPosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
              })
        })()

      setPendingAddPosition(null)

      const node = createFlowNode(type, position)
      if (!node) return
      addNode(node)
    },
    [pendingAddPosition, screenToFlowPosition, addNode, stopExecution],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (changes.some((change) => change.type === "remove")) {
        stopExecution()
      }
      const nextNodes = applyNodeChanges(changes, nodes)
      const dimensionChanges = changes.filter(
        (change): change is Extract<NodeChange, { type: "dimensions" }> =>
          change.type === "dimensions",
      )

      let syncedNodes = nextNodes
      if (dimensionChanges.length > 0) {
        const dimensionById = new Map(dimensionChanges.map((change) => [change.id, change]))
        syncedNodes = nextNodes.map((node) => {
          const change = dimensionById.get(node.id)
          if (!change || node.type !== "node:note") return node
          const domain = (node.data as { node?: INode }).node
          if (!domain) return node

          const config = readNoteConfiguration(domain.configuration)
          const width =
            change.dimensions?.width ?? node.width ?? node.measured?.width ?? config.width
          const height =
            change.dimensions?.height ?? node.height ?? node.measured?.height ?? config.height
          const configChanged = width !== config.width || height !== config.height

          return {
            ...node,
            width,
            height,
            ...(configChanged
              ? {
                  data: {
                    ...node.data,
                    node: {
                      ...domain,
                      configuration: { ...config, width, height },
                    },
                  },
                }
              : {}),
          }
        })
      }

      setNodes(syncedNodes)
      if (
        selectedNodeId &&
        changes.some((change) => change.type === "remove" && change.id === selectedNodeId)
      ) {
        setSelectedNodeId(null)
      }
      markDirty()
    },
    [nodes, selectedNodeId, setNodes, markDirty, stopExecution],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removedIds = changes
        .filter((change) => change.type === "remove")
        .map((change) => change.id)

      if (removedIds.length === 0) {
        setEdges(applyEdgeChanges(changes, edges))
        markDirty()
        return
      }

      stopExecution()
      let nextNodes = nodes
      for (const edgeId of removedIds) {
        const edge = edges.find((item) => item.id === edgeId)
        if (!edge) continue

        const sourceNode = nextNodes.find((node) => node.id === edge.source)
        const sourceDomain = (sourceNode?.data as { node?: INode } | undefined)?.node
        if (!sourceDomain) continue

        const isMainEdge = !edge.sourceHandle || edge.sourceHandle === "main"
        let updated: INode | null = null

        if (isMainEdge) {
          if (sourceDomain.nextNode === edge.target) {
            updated = { ...sourceDomain, nextNode: "" }
          }
        } else {
          updated =
            getNodeDefinition(sourceDomain.type)?.handlers.onDisconnect?.({
              edgeId: edge.id,
              sourceNodeId: sourceDomain.id,
              targetNodeId: edge.target,
              sourceHandle: edge.sourceHandle ?? null,
              targetHandle: edge.targetHandle ?? null,
              sourceNode: sourceDomain,
              targetNode: sourceDomain,
            }) ?? null
        }

        if (updated) {
          const finalNode = updated
          nextNodes = nextNodes.map((node) =>
            node.id === sourceDomain.id
              ? { ...node, data: { ...node.data, node: finalNode } }
              : node,
          )
          getNodeDefinition(sourceDomain.type)?.handlers.onUpdate?.({
            nodeId: sourceDomain.id,
            node: finalNode,
            reason: isMainEdge ? "next-node" : "configuration",
          })
        }
      }

      setNodes(nextNodes)
      setEdges(nodesToEdges(nextNodes))
      markDirty()
    },
    [edges, nodes, setNodes, setEdges, markDirty, stopExecution],
  )

  const handleNodeClick = useCallback(
    (_event: unknown, node: Node) => {
      const groupId = (node.data as { groupId?: string } | undefined)?.groupId
      if (groupId) {
        setNodes(
          nodes.map((item) => ({
            ...item,
            selected: (item.data as { groupId?: string } | undefined)?.groupId === groupId,
          })),
        )
      }
      if (node.type !== "node:note") {
        setSelectedNodeId(node.id)
      }
      setContextMenu(null)
    },
    [nodes, setNodes],
  )

  const handleNodeDoubleClick = useCallback((_event: unknown, node: Node) => {
    if (node.type === "node:note") {
      setSelectedNodeId(node.id)
    }
  }, [])

  const handleNoteChange = useCallback(
    (nodeId: string, text: string, color: NoteColor) => {
      setNodes(
        nodes.map((node) => {
          if (node.id !== nodeId) return node
          const domain = (node.data as { node?: INode }).node
          if (!domain || domain.type !== "node:note") return node

          const config = readNoteConfiguration(domain.configuration)
          return {
            ...node,
            data: {
              ...node.data,
              node: {
                ...domain,
                configuration: { ...config, text, color },
              },
            },
          }
        }),
      )
      markDirty()
    },
    [nodes, setNodes, markDirty],
  )

  const handleCloseDialog = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setContextMenu(null)
  }, [])

  const handlePaneContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent) => {
      if (!("clientX" in event)) return
      event.preventDefault()
      event.stopPropagation()
      setSelectedNodeId(null)
      setContextMenu({ x: event.clientX, y: event.clientY })
    },
    [],
  )

  const selectedNodes = useMemo(() => nodes.filter((node) => node.selected), [nodes])

  const selectNodes = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids)
      setNodes(nodes.map((node) => ({ ...node, selected: idSet.has(node.id) })))
    },
    [nodes, setNodes],
  )

  const handleOpenPaletteFromPane = useCallback(() => {
    if (!contextMenu) return
    setPendingAddPosition(screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y }))
    setPaletteOpen(true)
  }, [contextMenu, screenToFlowPosition])

  const handleNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      event.preventDefault()
      event.stopPropagation()

      const groupId = (node.data as { groupId?: string } | undefined)?.groupId
      const alreadySelected = Boolean(node.selected)

      if (groupId) {
        setNodes(
          nodes.map((item) => ({
            ...item,
            selected: (item.data as { groupId?: string } | undefined)?.groupId === groupId,
          })),
        )
      } else if (!alreadySelected) {
        selectNodes([node.id])
      }

      setSelectedNodeId(null)
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      })
    },
    [nodes, setNodes, selectNodes],
  )

  const handleDuplicateFromMenu = useCallback(
    (nodeId: string) => {
      const target = nodes.find((node) => node.id === nodeId)
      if (!target) return

      const selectedIds = new Set(
        nodes.filter((node) => node.selected).map((node) => node.id),
      )
      const sources =
        selectedIds.has(nodeId) && selectedIds.size > 1
          ? nodes.filter((node) => selectedIds.has(node.id))
          : [target]

      const { nodes: copies } = duplicateNodes(sources, edges)
      if (copies.length === 0) return

      const nextNodes = [
        ...nodes.map((node) => ({ ...node, selected: false })),
        ...copies.map((node) => {
          const nextData = { ...node.data }
          delete nextData.groupId
          return { ...node, selected: true, data: nextData }
        }),
      ]

      setNodes(nextNodes)
      setEdges(nodesToEdges(nextNodes))
      setContextMenu(null)
      markDirty()
    },
    [nodes, edges, setNodes, setEdges, markDirty],
  )

  const handleDeleteFromMenu = useCallback(
    (nodeId: string) => {
      const target = nodes.find((node) => node.id === nodeId)
      if (!target) return

      const selectedIds = new Set(
        nodes.filter((node) => node.selected).map((node) => node.id),
      )
      const idsToRemove =
        target.selected && selectedIds.size > 1 ? [...selectedIds] : [nodeId]
      const removeSet = new Set(idsToRemove)

      let nextNodes = nodes.filter((node) => !removeSet.has(node.id))

      for (const removedId of idsToRemove) {
        nextNodes = nextNodes.map((node) => {
          const nodeDomain = (node.data as { node?: INode }).node
          if (!nodeDomain) return node

          let cleared = nodeDomain
          const wasMain = nodeDomain.nextNode === removedId

          if (wasMain) {
            cleared = { ...cleared, nextNode: "" }
          }

          const afterTargetRemoved =
            getNodeDefinition(cleared.type)?.handlers.onTargetRemoved?.(
              cleared,
              removedId,
            ) ?? null
          if (afterTargetRemoved) cleared = afterTargetRemoved

          if (cleared === nodeDomain) return node

          return {
            ...node,
            data: {
              ...node.data,
              node: cleared,
            },
          }
        })
      }

      if (selectedNodeId && removeSet.has(selectedNodeId)) {
        setSelectedNodeId(null)
      }

      setNodes(nextNodes)
      setEdges(nodesToEdges(nextNodes))
      setContextMenu(null)
      markDirty()
    },
    [nodes, selectedNodeId, setNodes, setEdges, markDirty],
  )

  const handleLockGroup = useCallback(() => {
    const selected = nodes.filter((node) => node.selected)
    if (selected.length < 2) return

    const groupId = `group_${Math.random().toString(36).slice(2, 10)}`
    const selectedIds = new Set(selected.map((node) => node.id))

    setNodes(
      nodes.map((node) => {
        if (!selectedIds.has(node.id)) return node
        return {
          ...node,
          selected: true,
          data: { ...node.data, groupId },
        }
      }),
    )
    setContextMenu(null)
    markDirty()
  }, [nodes, setNodes, markDirty])

  const handleUnlockGroup = useCallback(
    (nodeId: string) => {
      const target = nodes.find((node) => node.id === nodeId)
      const groupId = (target?.data as { groupId?: string } | undefined)?.groupId
      if (!groupId) return

      setNodes(
        nodes.map((node) => {
          if ((node.data as { groupId?: string } | undefined)?.groupId !== groupId) {
            return node
          }
          const nextData = { ...node.data }
          delete nextData.groupId
          return { ...node, data: nextData }
        }),
      )
      setContextMenu(null)
      markDirty()
    },
    [nodes, setNodes, markDirty],
  )

  const contextMenuNode = useMemo(
    () =>
      contextMenu?.nodeId ? nodes.find((node) => node.id === contextMenu.nodeId) : null,
    [contextMenu, nodes],
  )
  const contextMenuGroupId = contextMenuNode
    ? (contextMenuNode.data as { groupId?: string } | undefined)?.groupId
    : undefined
  const canLock = selectedNodes.length >= 2 && !contextMenuGroupId

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) return []

    if (!contextMenu.nodeId) {
      return [
        {
          id: "add-node",
          label: "Agregar nodo",
          icon: Plus,
          onSelect: handleOpenPaletteFromPane,
        },
      ]
    }

    if (!contextMenuNode) return []

    const items: ContextMenuItem[] = [
      {
        id: "duplicate",
        label: "Duplicar",
        icon: Copy,
        onSelect: () => handleDuplicateFromMenu(contextMenu.nodeId!),
      },
      {
        id: "delete",
        label: "Eliminar",
        icon: Trash2,
        onSelect: () => handleDeleteFromMenu(contextMenu.nodeId!),
      },
    ]

    if (contextMenuGroupId) {
      items.push({
        id: "unlock",
        label: "Desbloquear",
        icon: Unlock,
        onSelect: () => handleUnlockGroup(contextMenu.nodeId!),
      })
    } else {
      items.push({
        id: "lock",
        label: "Bloquear selección",
        icon: Lock,
        disabled: !canLock,
        onSelect: () => handleLockGroup(),
      })
    }

    return items
  }, [
    contextMenu,
    contextMenuNode,
    contextMenuGroupId,
    canLock,
    handleOpenPaletteFromPane,
    handleDuplicateFromMenu,
    handleDeleteFromMenu,
    handleLockGroup,
    handleUnlockGroup,
  ])

  const selectedRfNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  )
  const selectedIsNote = selectedRfNode?.type === "node:note"
  const selectedNoteConfig = useMemo(() => {
    if (!selectedIsNote || !selectedRfNode) return null
    const domain = (selectedRfNode.data as { node?: INode }).node
    if (!domain) return null
    return readNoteConfiguration(domain.configuration)
  }, [selectedIsNote, selectedRfNode])
  const selectedDialogNode = selectedRfNode && !selectedIsNote ? toDialogInfo(selectedRfNode) : null
  const prevDialogNode =
    selectedNodeId && !selectedIsNote ? findPrevInfo(selectedNodeId, nodes) : null
  const nextDialogNode =
    selectedNodeId && !selectedIsNote ? findNextInfo(selectedNodeId, nodes) : null
  const selectedDefinition = selectedDialogNode
    ? getNodeDefinition(selectedDialogNode.type as FlowchartNodeType)
    : null

  const selectedConfiguration = useMemo(() => {
    if (!selectedRfNode || selectedIsNote) return undefined
    const domain = (selectedRfNode.data as { node?: INode }).node
    return domain?.configuration
  }, [selectedRfNode, selectedIsNote])

  const selectedParameterErrors = useMemo(() => {
    if (!selectedDefinition?.validate || selectedConfiguration === undefined) return undefined
    try {
      const result = selectedDefinition.validate(selectedConfiguration as never)
      return result && Object.keys(result).length > 0 ? result : undefined
    } catch {
      return undefined
    }
  }, [selectedDefinition, selectedConfiguration])

  const handleRenameNode = useCallback(
    (nodeId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return

      setNodes(
        nodes.map((node) => {
          if (node.id !== nodeId) return node
          const domain = (node.data as { node?: INode }).node
          if (!domain) return node
          return {
            ...node,
            data: {
              ...node.data,
              node: { ...domain, title: trimmed },
            },
          }
        }),
      )
      markDirty()
    },
    [nodes, setNodes, markDirty],
  )

  const handleUpdateConfiguration = useCallback(
    (nodeId: string, configuration: unknown) => {
      setNodes(
        nodes.map((node) => {
          if (node.id !== nodeId) return node
          const domain = (node.data as { node?: INode }).node
          if (!domain) return node

          const updated: INode = { ...domain, configuration }
          getNodeDefinition(domain.type)?.handlers.onUpdate?.({
            nodeId: domain.id,
            node: updated,
            reason: "configuration",
          })

          return {
            ...node,
            data: {
              ...node.data,
              node: updated,
            },
          }
        }),
      )
      markDirty()
    },
    [nodes, setNodes, markDirty],
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      stopExecution()
      const sourceNode = nodes.find((node) => node.id === connection.source)
      const targetNode = nodes.find((node) => node.id === connection.target)
      if (!sourceNode || !targetNode) return
      if (connection.source === connection.target) return

      const sourceDomain = (sourceNode.data as { node?: INode }).node
      const targetDomain = (targetNode.data as { node?: INode }).node
      if (!sourceDomain || !targetDomain) return

      const sourceDef = getNodeDefinition(sourceDomain.type)
      const targetDef = getNodeDefinition(targetDomain.type)

      const connectEvent = {
        sourceNodeId: sourceDomain.id,
        targetNodeId: targetDomain.id,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        sourceNode: sourceDomain,
        targetNode: targetDomain,
      }

      if (sourceDef?.handlers.onConnect && !sourceDef.handlers.onConnect(connectEvent)) return
      if (targetDef?.handlers.onConnect && !targetDef.handlers.onConnect(connectEvent)) return

      const isMainHandle = !connection.sourceHandle || connection.sourceHandle === "main"
      const sourceHandleId = connection.sourceHandle ?? "main"

      let nextEdges: Edge[]

      if (isMainHandle) {
        const withoutOldMain = edges.filter(
          (edge) =>
            !(edge.source === connection.source && (!edge.sourceHandle || edge.sourceHandle === "main")),
        )

        nextEdges = [
          ...withoutOldMain,
          {
            id: `edge_${connection.source}_${connection.target}_${sourceHandleId}`,
            source: connection.source,
            target: connection.target,
            sourceHandle: sourceHandleId,
            targetHandle: connection.targetHandle,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
        ]
      } else {
        const edgeId = `edge_${connection.source}_${connection.target}_${sourceHandleId}`
        if (edges.some((edge) => edge.id === edgeId)) return

        nextEdges = [
          ...edges,
          {
            id: edgeId,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
        ]
      }

      let updatedDomain: INode

      if (isMainHandle) {
        updatedDomain = { ...sourceDomain, nextNode: targetDomain.id }
        sourceDef?.handlers.onUpdate?.({
          nodeId: sourceDomain.id,
          node: updatedDomain,
          reason: "next-node",
        })
      } else {
        const applied =
          sourceDef?.handlers.applyConnection?.(sourceDomain, targetDomain.id, sourceHandleId) ??
          null
        if (!applied) return
        updatedDomain = applied
        sourceDef?.handlers.onUpdate?.({
          nodeId: sourceDomain.id,
          node: updatedDomain,
          reason: "configuration",
        })
      }

      const updatedSource: FlowchartRfNode = {
        ...(sourceNode as FlowchartRfNode),
        type: sourceDomain.type,
        data: {
          ...sourceNode.data,
          node: updatedDomain,
        },
      }

      const nextNodes = nodes.map((node) => (node.id === updatedSource.id ? updatedSource : node))

      setNodes(nextNodes)
      setEdges(nextEdges)
      markDirty()
    },
    [nodes, edges, setNodes, setEdges, markDirty, stopExecution],
  )

  const handleRemoveEdge = useCallback(
    (edgeId: string) => {
      stopExecution()
      const edge = edges.find((item) => item.id === edgeId)
      if (!edge) return

      const sourceNode = nodes.find((node) => node.id === edge.source)
      const targetNode = nodes.find((node) => node.id === edge.target)
      const sourceDomain = (sourceNode?.data as { node?: INode } | undefined)?.node
      const targetDomain = (targetNode?.data as { node?: INode } | undefined)?.node
      if (!sourceDomain) return

      const isMainEdge = !edge.sourceHandle || edge.sourceHandle === "main"
      let updated: INode | null = null

      if (isMainEdge) {
        if (sourceDomain.nextNode === edge.target) {
          updated = { ...sourceDomain, nextNode: "" }
        }
      } else if (targetDomain) {
        updated =
          getNodeDefinition(sourceDomain.type)?.handlers.onDisconnect?.({
            edgeId,
            sourceNodeId: sourceDomain.id,
            targetNodeId: targetDomain.id,
            sourceHandle: edge.sourceHandle ?? null,
            targetHandle: edge.targetHandle ?? null,
            sourceNode: sourceDomain,
            targetNode: targetDomain,
          }) ?? null
      }

      let nextNodes = nodes
      if (updated) {
        const finalNode = updated
        nextNodes = nodes.map((node) =>
          node.id === sourceDomain.id
            ? { ...node, data: { ...node.data, node: finalNode } }
            : node,
        )
        getNodeDefinition(sourceDomain.type)?.handlers.onUpdate?.({
          nodeId: sourceDomain.id,
          node: finalNode,
          reason: isMainEdge ? "next-node" : "configuration",
        })
      }

      setNodes(nextNodes)
      setEdges(nodesToEdges(nextNodes))
      markDirty()
    },
    [edges, nodes, setNodes, setEdges, markDirty, stopExecution],
  )

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      stopExecution()
      const rfNode = nodes.find((node) => node.id === nodeId)
      const domain = (rfNode?.data as { node?: INode } | undefined)?.node
      if (!rfNode || !domain) return

      const definition = getNodeDefinition(domain.type)
      if (definition?.handlers.onDelete && !definition.handlers.onDelete({ nodeId, node: domain })) {
        return
      }

      let nextNodes = nodes.filter((node) => node.id !== nodeId)

      nextNodes = nextNodes.map((node) => {
        const nodeDomain = (node.data as { node?: INode }).node
        if (!nodeDomain) return node

        let cleared = nodeDomain
        const wasMain = nodeDomain.nextNode === nodeId

        if (wasMain) {
          cleared = { ...cleared, nextNode: "" }
        }

        const afterTargetRemoved =
          getNodeDefinition(cleared.type)?.handlers.onTargetRemoved?.(cleared, nodeId) ?? null
        if (afterTargetRemoved) cleared = afterTargetRemoved

        if (cleared === nodeDomain) return node

        getNodeDefinition(cleared.type)?.handlers.onUpdate?.({
          nodeId: cleared.id,
          node: cleared,
          reason: wasMain && !afterTargetRemoved ? "next-node" : "configuration",
        })

        return {
          ...node,
          data: {
            ...node.data,
            node: cleared,
          },
        }
      })

      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null)
      }

      setNodes(nextNodes)
      setEdges(nodesToEdges(nextNodes))
      markDirty()
    },
    [nodes, edges, selectedNodeId, setNodes, setEdges, markDirty, stopExecution],
  )

  return (
    <div className="flex min-h-0 w-full flex-1">
      <div ref={canvasContainerRef} className="relative min-h-0 min-w-0 flex-1">
        <FlowchartCanvas
          nodes={nodes}
          edges={edges}
          colorMode={resolvedTheme}
          className="h-full w-full"
          executingNodeId={activeNodeId}
          executingEdgeIds={executingEdgeIds}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onRemoveEdge={handleRemoveEdge}
          onRemoveNode={handleRemoveNode}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={handlePaneContextMenu}
        />
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
          <div className="pointer-events-auto">
            <ExecuteFlowButton
              triggers={onClickTriggers}
              running={executing}
              onExecute={handleExecuteTrigger}
            />
          </div>
        </div>
        {selectedIsNote && selectedRfNode && selectedNoteConfig ? (
          <NoteDialog
            open
            text={selectedNoteConfig.text}
            color={selectedNoteConfig.color}
            onClose={handleCloseDialog}
            onSave={(text, color) => handleNoteChange(selectedRfNode.id, text, color)}
          />
        ) : (
          <NodeDialog
            open={Boolean(selectedDialogNode)}
            node={selectedDialogNode}
            prev={prevDialogNode}
            next={nextDialogNode}
            actions={selectedDefinition?.actions}
            onRenameNode={handleRenameNode}
            configuration={selectedConfiguration}
            parameters={selectedDefinition?.parameters}
            onUpdateConfiguration={handleUpdateConfiguration}
            parameterErrors={selectedParameterErrors}
            onClose={handleCloseDialog}
          />
        )}
        <FlowchartContextMenu
          open={Boolean(contextMenu)}
          x={contextMenu?.x ?? 0}
          y={contextMenu?.y ?? 0}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          {!paletteOpen ? (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background shadow-sm"
              onClick={() => {
                setPendingAddPosition(null)
                setPaletteOpen(true)
              }}
              aria-label="Abrir paleta de nodos"
              title="Abrir paleta de nodos"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-background shadow-sm"
            onClick={() => handleAddNode("node:note")}
            aria-label="Agregar nota"
            title="Agregar nota"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {paletteOpen ? (
        <NodePalette
          items={paletteItems}
          onSelect={handleAddNode}
          onClose={() => setPaletteOpen(false)}
          className="flex min-h-0 w-64 shrink-0 flex-col border-l border-border bg-background"
        />
      ) : null}
    </div>
  )
}
