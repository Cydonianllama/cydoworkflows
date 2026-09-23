import type { NodeTypes } from "@xyflow/react"
import { createExecutionAwareComponent } from "./executionAware"
import type { FlowchartNodeType, INode, NodeDefinition, OutgoingEdge } from "./types"

const registry = new Map<FlowchartNodeType, NodeDefinition>()

export function registerNode(definition: NodeDefinition): void {
  registry.set(definition.type, definition)
}

export function getNodeDefinition(type: FlowchartNodeType): NodeDefinition | undefined {
  return registry.get(type)
}

export function listNodeDefinitions(): NodeDefinition[] {
  return [...registry.values()]
}

export function getOutgoingEdges(node: INode): OutgoingEdge[] {
  const definition = getNodeDefinition(node.type)
  if (definition?.outgoingEdges) return definition.outgoingEdges(node)
  if (node.nextNode) return [{ sourceHandle: "main", target: node.nextNode }]
  return []
}

export function buildNodeTypes(): NodeTypes {
  const nodeTypes: NodeTypes = {}
  for (const definition of registry.values()) {
    nodeTypes[definition.type] = createExecutionAwareComponent(definition)
  }
  return nodeTypes
}
