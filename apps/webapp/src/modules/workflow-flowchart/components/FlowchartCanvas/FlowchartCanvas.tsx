import { useCallback, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  SelectionMode,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react"
import { getNodeDefinition, flowchartNodeTypes } from "../../nodes"
import { readNoteConfiguration } from "../../nodes/note/noteNode"
import type { INode } from "../../nodes/types"
import { FlowchartEdge } from "../FlowchartEdge/FlowchartEdge"
import type { FlowchartCanvasProps } from "./flowchartCanvasProps"

const edgeTypes = { default: FlowchartEdge }

const EXEC_EDGE_STROKE = "#10b981"

function isNoteNode(type: string | undefined): boolean {
  return type === "node:note"
}

export function FlowchartCanvas({
  nodes,
  edges,
  colorMode = "light",
  className,
  executingNodeId = null,
  executingEdgeIds,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onRemoveEdge,
  onRemoveNode,
  onNodeClick,
  onNodeDoubleClick,
  onNodeContextMenu,
  onPaneClick,
  onPaneContextMenu,
}: FlowchartCanvasProps) {
  const nodesWithDelete = useMemo(
    () =>
      nodes.map((node) => {
        const groupId = (node.data as { groupId?: string } | undefined)?.groupId
        const domain = (node.data as { node?: INode } | undefined)?.node
        const note =
          isNoteNode(node.type) && domain
            ? readNoteConfiguration(domain.configuration)
            : null
        const isExecuting = node.id === executingNodeId

        return {
          ...node,
          zIndex: isNoteNode(node.type) ? -1 : (node.zIndex ?? 0),
          ...(note
            ? {
                connectable: false,
                width: node.width ?? node.measured?.width ?? note.width,
                height: node.height ?? node.measured?.height ?? note.height,
              }
            : {}),
          className: [
            groupId ? "ring-2 ring-primary/70 rounded-lg" : undefined,
            isNoteNode(node.type) ? "rounded-md" : undefined,
            isExecuting ? "flowchart-node-executing" : undefined,
          ]
            .filter(Boolean)
            .join(" ") || undefined,
          data: {
            ...node.data,
            onDelete: onRemoveNode,
            executing: isExecuting,
          },
        }
      }),
    [nodes, onRemoveNode, executingNodeId],
  )

  const edgesWithDelete = useMemo(
    () =>
      edges.map((edge) => {
        const isExecuting = executingEdgeIds?.has(edge.id) ?? false

        return {
          ...edge,
          animated: isExecuting || edge.animated,
          style: isExecuting
            ? {
                ...edge.style,
                stroke: EXEC_EDGE_STROKE,
                strokeWidth: 2,
              }
            : edge.style,
          markerEnd: isExecuting
            ? {
                type: MarkerType.ArrowClosed,
                color: EXEC_EDGE_STROKE,
              }
            : edge.markerEnd,
          data: { ...edge.data, onDelete: onRemoveEdge, executing: isExecuting },
        }
      }),
    [edges, onRemoveEdge, executingEdgeIds],
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect?.(connection)
    },
    [onConnect],
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange?.(changes)
    },
    [onNodesChange],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange?.(changes)
    },
    [onEdgesChange],
  )

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (connection.source === connection.target) return false

      const sourceNode = nodes.find((node) => node.id === connection.source)
      const targetNode = nodes.find((node) => node.id === connection.target)
      const sourceDomain = (sourceNode?.data as { node?: INode } | undefined)?.node
      const targetDomain = (targetNode?.data as { node?: INode } | undefined)?.node
      if (!sourceDomain || !targetDomain) return false

      const connectEvent = {
        sourceNodeId: sourceDomain.id,
        targetNodeId: targetDomain.id,
        sourceHandle: ("sourceHandle" in connection ? connection.sourceHandle : null) ?? null,
        targetHandle: ("targetHandle" in connection ? connection.targetHandle : null) ?? null,
        sourceNode: sourceDomain,
        targetNode: targetDomain,
      }

      const sourceDef = getNodeDefinition(sourceDomain.type)
      const targetDef = getNodeDefinition(targetDomain.type)
      if (sourceDef?.handlers.onConnect && !sourceDef.handlers.onConnect(connectEvent)) {
        return false
      }
      if (targetDef?.handlers.onConnect && !targetDef.handlers.onConnect(connectEvent)) {
        return false
      }

      return true
    },
    [nodes],
  )

  return (
    <div className={className}>
      <ReactFlow
        nodes={nodesWithDelete}
        edges={edgesWithDelete}
        nodeTypes={flowchartNodeTypes}
        edgeTypes={edgeTypes}
        colorMode={colorMode}
        fitView
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1]}
        zIndexMode="manual"
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
}
