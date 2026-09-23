import { Globe } from "lucide-react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { NodeDeleteButton } from "../../components/NodeDeleteButton/NodeDeleteButton"
import type {
  CallApiConfiguration,
  FlowchartRfNode,
  NodeDefinition,
  NodeParameterEntry,
} from "../types"
import { renameNodeAction } from "../nodeActions"

const CALL_API_METHODS = ["GET", "POST", "PUT", "DELETE"] as const

export function readCallApiConfiguration(configuration: unknown): CallApiConfiguration {
  const defaults: CallApiConfiguration = {
    parameters: [
      { type: "METHOD", value: "POST" },
      { type: "URL", value: "" },
      { type: "BODY", value: "" },
    ],
  }

  if (!configuration || typeof configuration !== "object") return defaults
  const params = (configuration as { parameters?: unknown }).parameters
  if (!Array.isArray(params)) return defaults

  const parameters: NodeParameterEntry[] = []
  for (const entry of params) {
    if (!entry || typeof entry !== "object") continue
    const type = (entry as { type?: unknown }).type
    const value = (entry as { value?: unknown }).value
    if (typeof type !== "string" || type.length === 0) continue
    if (value === undefined) continue
    parameters.push({ type, value: value as NodeParameterEntry["value"] })
  }

  if (parameters.length === 0) return defaults

  for (const defaultEntry of defaults.parameters) {
    if (!parameters.some((entry) => entry.type === defaultEntry.type)) {
      parameters.push(defaultEntry)
    }
  }

  return { parameters }
}

function CallApiFlowNode({ data }: NodeProps) {
  const node = (data as { node?: FlowchartRfNode["data"]["node"] }).node
  const onDelete = (data as { onDelete?: (nodeId: string) => void }).onDelete
  if (!node) return null

  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      <NodeDeleteButton onDelete={() => onDelete?.(node.id)} />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:border-primary/60 hover:bg-accent/60 hover:shadow-sm">
        <Globe className="h-5 w-5" />
      </div>
      <div className="whitespace-nowrap text-sm font-medium text-foreground">{node.title}</div>
      <Handle type="source" position={Position.Right} id="main" className="!bg-muted-foreground" />
    </div>
  )
}

export const callApiNode: NodeDefinition<CallApiConfiguration> = {
  type: "node:callapi",
  defaultTitle: "Call API",
  description: "Realiza una petición HTTP a una API.",
  Icon: Globe,
  category: "logica",
  defaultConfiguration: {
    parameters: [
      { type: "METHOD", value: "POST" },
      { type: "URL", value: "" },
      { type: "BODY", value: "" },
    ],
  },
  FlowComponent: CallApiFlowNode,
  actions: [renameNodeAction],
  parameters: [
    {
      type: "METHOD",
      label: "Method",
      editor: "select",
      required: true,
      options: CALL_API_METHODS.map((method) => ({ value: method, label: method })),
      defaultValue: "POST",
    },
    {
      type: "URL",
      label: "URL",
      editor: "input",
      required: true,
      placeholder: "https://api.ejemplo.com/...",
      defaultValue: "",
    },
    {
      type: "BODY",
      label: "Body",
      editor: "textarea",
      required: true,
      placeholder: '{"clave": "valor"}',
      defaultValue: "",
    },
    {
      type: "HEADERS",
      label: "Headers",
      editor: "keyvalue",
      required: false,
      defaultValue: [],
    },
  ],
  validate(configuration: CallApiConfiguration | unknown): Record<string, string> {
    const errors: Record<string, string> = {}
    const config = readCallApiConfiguration(configuration)
    const method = config.parameters.find((entry) => entry.type === "METHOD")?.value
    const url = config.parameters.find((entry) => entry.type === "URL")?.value

    if (typeof method !== "string" || !CALL_API_METHODS.includes(method as (typeof CALL_API_METHODS)[number])) {
      errors.METHOD = "Method requerido"
    }
    if (typeof url !== "string" || !url.trim()) {
      errors.URL = "URL requerida"
    }
    return errors
  },
  handlers: {
    onConnect() {
      return true
    },
    onDelete() {
      return true
    },
  },
}
