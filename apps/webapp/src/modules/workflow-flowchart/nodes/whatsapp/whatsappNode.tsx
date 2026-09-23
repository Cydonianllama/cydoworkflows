import { MessageCircle } from "lucide-react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeDeleteButton } from "../../components/NodeDeleteButton/NodeDeleteButton"
import type {
  DisconnectEvent,
  FlowchartRfNode,
  INode,
  NodeDefinition,
  OutgoingEdge,
  UpdateEvent,
  WhatsAppButton,
  WhatsAppConfiguration,
} from "../types"
import { renameNodeAction } from "../nodeActions"

function extractButtons(configuration: unknown): WhatsAppButton[] {
  if (!configuration || typeof configuration !== "object") return []
  const props = (configuration as WhatsAppConfiguration).properties
  if (!Array.isArray(props)) return []
  const buttonsProp = props.find((prop) => prop.type === "buttons")
  if (!buttonsProp || !Array.isArray(buttonsProp.value)) return []
  return buttonsProp.value
}

function setButtons(
  configuration: unknown,
  mapButton: (button: WhatsAppButton) => WhatsAppButton | null,
): unknown | null {
  if (!configuration || typeof configuration !== "object") return null
  const config = configuration as WhatsAppConfiguration
  if (!Array.isArray(config.properties)) return null

  let changed = false
  const nextProperties = config.properties.map((prop) => {
    if (prop.type !== "buttons" || !Array.isArray(prop.value)) return prop
    let propChanged = false
    const nextValue: WhatsAppButton[] = []
    for (const button of prop.value) {
      const mapped = mapButton(button)
      if (mapped === null) {
        propChanged = true
        continue
      }
      if (mapped !== button) propChanged = true
      nextValue.push(mapped)
    }
    if (!propChanged) return prop
    changed = true
    return { ...prop, value: nextValue }
  })

  if (!changed) return null
  return { ...config, properties: nextProperties }
}

function withButtons(node: INode, configuration: unknown): INode | null {
  if (configuration === null) return null
  return { ...node, configuration }
}

function WhatsAppFlowNode({ data }: NodeProps) {
  const node = (data as { node?: FlowchartRfNode["data"]["node"] }).node
  const onDelete = (data as { onDelete?: (nodeId: string) => void }).onDelete
  if (!node) return null

  const buttons = extractButtons(node.configuration)

  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      <NodeDeleteButton onDelete={() => onDelete?.(node.id)} />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:border-primary/60 hover:bg-accent/60 hover:shadow-sm">
        <MessageCircle className="h-5 w-5" />
      </div>
      <div className="whitespace-nowrap text-sm font-medium text-foreground">{node.title}</div>
      {buttons.length > 0 ? (
        <div className="flex flex-col gap-1">
          {buttons.map((button, index) => (
            <div key={button.id || `button-${index}`} className="relative flex items-center">
              <div className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {button.text || `Botón ${index + 1}`}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={button.id || `button-${index}`}
                style={{ right: -6, top: "50%" }}
                className="!h-2 !w-2 !bg-primary"
              />
            </div>
          ))}
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} id="main" className="!bg-muted-foreground" />
    </div>
  )
}

export const whatsappNode: NodeDefinition<WhatsAppConfiguration> = {
  type: "node:whatsapp",
  defaultTitle: "WhatsApp",
  description: "Envía un mensaje de WhatsApp.",
  Icon: MessageCircle,
  category: "misc",
  defaultConfiguration: {
    action: "sendMessage",
    properties: [
      { type: "message", value: "" },
      { type: "buttons", value: [] },
    ],
  },
  FlowComponent: WhatsAppFlowNode,
  actions: [renameNodeAction],
  outgoingEdges(node: INode): OutgoingEdge[] {
    const edges: OutgoingEdge[] = []
    if (node.nextNode) edges.push({ sourceHandle: "main", target: node.nextNode })
    for (const button of extractButtons(node.configuration)) {
      if (button.nextNode) edges.push({ sourceHandle: button.id, target: button.nextNode })
    }
    return edges
  },
  mapReferences(node: INode, resolve: (id: string) => string): INode {
    const nextNode = node.nextNode ? resolve(node.nextNode) : node.nextNode
    if (!node.configuration || typeof node.configuration !== "object") {
      return { ...node, nextNode }
    }

    const config = node.configuration as WhatsAppConfiguration
    if (!Array.isArray(config.properties)) {
      return { ...node, nextNode }
    }

    const properties = config.properties.map((prop) => {
      if (prop.type !== "buttons" || !Array.isArray(prop.value)) return prop
      return {
        ...prop,
        value: prop.value.map((button) => ({
          ...button,
          nextNode: button.nextNode ? resolve(button.nextNode) : button.nextNode,
        })),
      }
    })

    return {
      ...node,
      nextNode,
      configuration: { ...config, properties },
    }
  },
  handlers: {
    onConnect(event) {
      if (event.sourceHandle && event.sourceHandle !== "main") {
        if (event.sourceNode.type !== "node:whatsapp") return false
        return extractButtons(event.sourceNode.configuration).some(
          (button) => button.id === event.sourceHandle,
        )
      }
      return true
    },
    applyConnection(node, targetNodeId, sourceHandle) {
      if (!sourceHandle || sourceHandle === "main") return null
      let found = false
      const configuration = setButtons(node.configuration, (button) => {
        if (button.id !== sourceHandle) return button
        found = true
        if (button.nextNode === targetNodeId) return button
        return { ...button, nextNode: targetNodeId }
      })
      if (!found || configuration === null) return null
      return withButtons(node, configuration)
    },
    onDisconnect(event: DisconnectEvent) {
      const handle = event.sourceHandle
      if (!handle || handle === "main") return null
      let found = false
      const configuration = setButtons(event.sourceNode.configuration, (button) => {
        if (button.id !== handle || !button.nextNode) return button
        found = true
        return { ...button, nextNode: "" }
      })
      if (!found || configuration === null) return null
      return withButtons(event.sourceNode, configuration)
    },
    onTargetRemoved(node, targetNodeId) {
      let any = false
      const configuration = setButtons(node.configuration, (button) => {
        if (button.nextNode !== targetNodeId) return button
        any = true
        return { ...button, nextNode: "" }
      })
      if (!any || configuration === null) return null
      return withButtons(node, configuration)
    },
    onUpdate(event: UpdateEvent) {
      if (event.reason === "configuration") {
        const buttons = extractButtons(event.node.configuration)
        for (const button of buttons) {
          if (!button.id) {
            button.id = `btn_${Math.random().toString(36).slice(2, 10)}`
          }
          if (button.nextNode === undefined) {
            button.nextNode = ""
          }
        }
      }
    },
    onDelete() {
      return true
    },
  },
}
