import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import type { Node, NodeProps } from "@xyflow/react"

export type FlowchartNodeType =
  | "node:trigger"
  | "node:agent"
  | "node:whatsapp"
  | "node:triggerwebhook"
  | "node:openai"
  | "node:deepseek"
  | "node:callapi"
  | "node:cydoflow"
  | "node:switch"
  | "node:note"
  | "node:redis"
  | "node:scheduletrigger"
  | "node:code"
  | "node:humanapproval"
  | "node:gmail"
  | "node:sheets"
  | "node:supabase"
  | "node:calendar"
  | "node:notion"
  | "node:triggeronclick"
  | "node:wait"
  | "node:editfield"
  | "node:if"
  | "node:telegram"
  | "node:postgres"
  | "node:mongo"
  | "node:airtable"

export type NodeCategory = "ia" | "logica" | "triggers" | "integraciones" | "misc"

export interface INode {
  id: string
  title: string
  createdAt: string
  type: FlowchartNodeType
  configuration: unknown
  nextNode: string
}

export interface TriggerConfiguration {}

export interface TriggerOnClickConfiguration {}

export interface WaitConfiguration {}

export interface AgentConfiguration {
  prompt: string
}

export interface TriggerWebhookConfiguration {}

export interface OpenAIConfiguration {}

export interface DeepSeekConfiguration {}

export interface CallApiHeader {
  key: string
  value: string
}

export type CallApiMethod = "POST" | "GET" | "PUT" | "DELETE"

/** Editor de un parámetro de configuration en la pestaña Parameters. */
export type NodeParameterEditorKind = "input" | "select" | "switch" | "textarea" | "keyvalue"

/** Valor genérico de un parámetro. `keyvalue` usa `Array<{ key; value }>` (p.ej. HEADERS). */
export type NodeParameterValue =
  | string
  | number
  | boolean
  | Array<{ key: string; value: string }>

/** Entrada de configuration.parameters: `{ type: "METHOD", value: "POST" }`. */
export interface NodeParameterEntry {
  type: string
  value: NodeParameterValue
}

/** Declaración de un parámetro en NodeDefinition.parameters. */
export interface NodeParameterField {
  type: string
  label: string
  editor: NodeParameterEditorKind
  /** true = siempre visible; false = agregable/retirable desde el select de opcionales. */
  required?: boolean
  /** Opciones para editor "select". */
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  defaultValue: NodeParameterValue
}

/** Configuración del nodo Call API: lista de parámetros tipados. */
export interface CallApiConfiguration {
  parameters: NodeParameterEntry[]
}

export interface CydoflowConfiguration {}

export interface SwitchConfiguration {}

export type NoteColor = "amber" | "red" | "green" | "purple" | "blue"

export interface NoteConfiguration {
  text: string
  width: number
  height: number
  color: NoteColor
}

export type RedisOperation = "get" | "set" | "delete"

export interface RedisConfiguration {
  operation: RedisOperation
  key: string
  value: string
}

export interface ScheduleTriggerConfiguration {
  cron: string
  timezone: string
}

export interface CodeConfiguration {
  language: string
  code: string
}

export interface HumanApprovalConfiguration {
  assignee: string
  message: string
}

export interface GmailConfiguration {
  to: string
  subject: string
  body: string
}

export interface SheetsConfiguration {
  spreadsheetId: string
  range: string
  values: string
}

export type SupabaseOperation = "select" | "insert" | "update" | "delete"

export interface SupabaseConfiguration {
  operation: SupabaseOperation
  table: string
  query: string
}

export interface CalendarConfiguration {
  summary: string
  start: string
  end: string
}

export interface NotionConfiguration {
  databaseId: string
  title: string
  content: string
}

export interface WhatsAppButton {
  id: string
  text: string
  nextNode: string
}

export interface WhatsAppMessageProperty {
  type: "message"
  value: string
}

export interface WhatsAppButtonsProperty {
  type: "buttons"
  value: WhatsAppButton[]
}

export type WhatsAppProperty = WhatsAppMessageProperty | WhatsAppButtonsProperty

export interface WhatsAppConfiguration {
  action: "sendMessage"
  properties: WhatsAppProperty[]
}

export interface EditFieldConfiguration {
  key: string
  value: string
}

export interface IfConfiguration {
  condition: string
  trueNextNode: string
  falseNextNode: string
}

export interface TelegramConfiguration {
  botToken: string
  chatId: string
  text: string
}

export interface PostgresConfiguration {
  connectionString: string
  query: string
}

export type MongoOperation = "find" | "insert" | "update" | "delete"

export interface MongoConfiguration {
  uri: string
  collection: string
  operation: MongoOperation
  filter: string
}

export type AirtableOperation = "list" | "create" | "update"

export interface AirtableConfiguration {
  baseId: string
  tableId: string
  operation: AirtableOperation
  filterFormula: string
}

export type FlowchartRfNode = Node<{ node: INode; groupId?: string }, FlowchartNodeType>

export interface ConnectEvent {
  sourceNodeId: string
  targetNodeId: string
  sourceHandle: string | null
  targetHandle: string | null
  sourceNode: INode
  targetNode: INode
}

export interface DisconnectEvent {
  edgeId: string
  sourceNodeId: string
  targetNodeId: string
  sourceHandle: string | null
  targetHandle: string | null
  sourceNode: INode
  targetNode: INode
}

export interface UpdateEvent {
  nodeId: string
  node: INode
  reason: "configuration" | "title" | "next-node"
}

export interface DeleteEvent {
  nodeId: string
  node: INode
}

export interface OutgoingEdge {
  sourceHandle: string
  target: string
}

export interface NodeExecuteResult {
  /** IDs de los nodos siguientes a recorrer. */
  nextNodeIds: string[]
}

export interface NodeExecutionConfig {
  /** ms con animación antes de pasar al siguiente. */
  delayMs?: number
  /** Icono "reloaded" que gira mientras el nodo está activo. */
  Icon?: LucideIcon
  /** Énfasis verde del nodo activo. */
  activeClassName?: string
}

export interface NodeAction {
  id: string
  label: string
}

export interface NodeDefinitionHandlers {
  onConnect?(event: ConnectEvent): boolean
  onDisconnect?(event: DisconnectEvent): INode | null
  onUpdate?(event: UpdateEvent): void
  onDelete?(event: DeleteEvent): boolean
  applyConnection?(node: INode, targetNodeId: string, sourceHandle: string): INode | null
  onTargetRemoved?(node: INode, targetNodeId: string): INode | null
}

export interface NodeDefinition<TConfiguration = unknown> {
  type: FlowchartNodeType
  defaultTitle: string
  description: string
  Icon: LucideIcon
  category: NodeCategory
  defaultConfiguration: TConfiguration
  FlowComponent: ComponentType<NodeProps>
  outgoingEdges?(node: INode): OutgoingEdge[]
  mapReferences?(node: INode, resolve: (id: string) => string): INode
  /** Valida la configuración. Clave = type del parámetro (p.ej. "URL"), valor = mensaje. [] = OK. */
  validate?(configuration: TConfiguration): Record<string, string>
  /** Lógica de ejecución al recorrer este nodo (fuera del engine). Si no existe, se usan las outgoingEdges. */
  onExecute?(node: INode): NodeExecuteResult | void
  /** Animación y delay al ejecutar este nodo en la simulación visual. */
  execution?: NodeExecutionConfig
  /** Ediciones comunes disponibles en el dialog (rename, etc.). */
  actions?: NodeAction[]
  /** Schema de parámetros editables en la pestaña Parameters del NodeDialog. */
  parameters?: NodeParameterField[]
  handlers: NodeDefinitionHandlers
}
