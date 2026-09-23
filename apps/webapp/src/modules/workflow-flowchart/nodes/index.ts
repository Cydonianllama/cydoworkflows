import { registerNode, buildNodeTypes } from "./registry"
import { triggerNode } from "./trigger/triggerNode"
import { agentNode } from "./agent/agentNode"
import { whatsappNode } from "./whatsapp/whatsappNode"
import { triggerWebhookNode } from "./triggerWebhook/triggerWebhookNode"
import { openaiNode } from "./openai/openaiNode"
import { deepseekNode } from "./deepseek/deepseekNode"
import { callApiNode } from "./callapi/callapiNode"
import { cydoflowNode } from "./cydoflow/cydoflowNode"
import { switchNode } from "./switch/switchNode"
import { noteNode } from "./note/noteNode"
import { redisNode } from "./redis/redisNode"
import { scheduleTriggerNode } from "./scheduleTrigger/scheduleTriggerNode"
import { codeNode } from "./code/codeNode"
import { humanApprovalNode } from "./humanApproval/humanApprovalNode"
import { gmailNode } from "./gmail/gmailNode"
import { sheetsNode } from "./sheets/sheetsNode"
import { supabaseNode } from "./supabase/supabaseNode"
import { calendarNode } from "./calendar/calendarNode"
import { notionNode } from "./notion/notionNode"
import { triggerOnClickNode } from "./triggerOnClick/triggerOnClickNode"
import { waitNode } from "./wait/waitNode"
import { editFieldNode } from "./editField/editFieldNode"
import { ifNode } from "./if/ifNode"
import { telegramNode } from "./telegram/telegramNode"
import { postgresNode } from "./postgres/postgresNode"
import { mongoNode } from "./mongo/mongoNode"
import { airtableNode } from "./airtable/airtableNode"

registerNode(triggerNode)
registerNode(triggerWebhookNode)
registerNode(triggerOnClickNode)
registerNode(scheduleTriggerNode)
registerNode(editFieldNode)
registerNode(ifNode)
registerNode(telegramNode)
registerNode(postgresNode)
registerNode(mongoNode)
registerNode(airtableNode)
registerNode(agentNode)
registerNode(openaiNode)
registerNode(deepseekNode)
registerNode(callApiNode)
registerNode(cydoflowNode)
registerNode(switchNode)
registerNode(codeNode)
registerNode(waitNode)
registerNode(humanApprovalNode)
registerNode(whatsappNode)
registerNode(gmailNode)
registerNode(sheetsNode)
registerNode(supabaseNode)
registerNode(calendarNode)
registerNode(notionNode)
registerNode(redisNode)
registerNode(noteNode)

export {
  registerNode,
  getNodeDefinition,
  listNodeDefinitions,
  buildNodeTypes,
  getOutgoingEdges,
} from "./registry"
export { DEFAULT_NODE_EXECUTION, resolveExecutionConfig } from "./executionDefaults"
export {
  renameNodeAction,
  DEFAULT_NODE_ACTIONS,
  resolveNodeActions,
  hasNodeAction,
} from "./nodeActions"
export { triggerNode } from "./trigger/triggerNode"
export { agentNode } from "./agent/agentNode"
export { whatsappNode } from "./whatsapp/whatsappNode"
export { triggerWebhookNode } from "./triggerWebhook/triggerWebhookNode"
export { triggerOnClickNode } from "./triggerOnClick/triggerOnClickNode"
export { editFieldNode } from "./editField/editFieldNode"
export { ifNode } from "./if/ifNode"
export { telegramNode } from "./telegram/telegramNode"
export { postgresNode } from "./postgres/postgresNode"
export { mongoNode } from "./mongo/mongoNode"
export { airtableNode } from "./airtable/airtableNode"
export { openaiNode } from "./openai/openaiNode"
export { deepseekNode } from "./deepseek/deepseekNode"
export { callApiNode, readCallApiConfiguration } from "./callapi/callapiNode"
export { cydoflowNode } from "./cydoflow/cydoflowNode"
export { switchNode } from "./switch/switchNode"
export { redisNode } from "./redis/redisNode"
export { scheduleTriggerNode } from "./scheduleTrigger/scheduleTriggerNode"
export { codeNode } from "./code/codeNode"
export { humanApprovalNode } from "./humanApproval/humanApprovalNode"
export { waitNode } from "./wait/waitNode"
export { gmailNode } from "./gmail/gmailNode"
export { sheetsNode } from "./sheets/sheetsNode"
export { supabaseNode } from "./supabase/supabaseNode"
export { calendarNode } from "./calendar/calendarNode"
export { notionNode } from "./notion/notionNode"
export {
  noteNode,
  readNoteConfiguration,
  isNoteColor,
  NOTE_DEFAULT_WIDTH,
  NOTE_DEFAULT_HEIGHT,
  NOTE_DEFAULT_COLOR,
} from "./note/noteNode"
export type {
  FlowchartNodeType,
  NodeCategory,
  INode,
  NodeDefinition,
  NodeExecuteResult,
  NodeExecutionConfig,
  NodeAction,
  TriggerConfiguration,
  TriggerOnClickConfiguration,
  WaitConfiguration,
  AgentConfiguration,
  WhatsAppConfiguration,
  TriggerWebhookConfiguration,
  OpenAIConfiguration,
  DeepSeekConfiguration,
  CallApiConfiguration,
  CallApiHeader,
  CallApiMethod,
  NodeParameterEditorKind,
  NodeParameterValue,
  NodeParameterEntry,
  NodeParameterField,
  CydoflowConfiguration,
  SwitchConfiguration,
  NoteColor,
  NoteConfiguration,
  RedisConfiguration,
  RedisOperation,
  ScheduleTriggerConfiguration,
  CodeConfiguration,
  HumanApprovalConfiguration,
  GmailConfiguration,
  SheetsConfiguration,
  SupabaseConfiguration,
  SupabaseOperation,
  CalendarConfiguration,
  NotionConfiguration,
  EditFieldConfiguration,
  IfConfiguration,
  TelegramConfiguration,
  PostgresConfiguration,
  MongoConfiguration,
  MongoOperation,
  AirtableConfiguration,
  AirtableOperation,
} from "./types"

export const flowchartNodeTypes = buildNodeTypes()

