import { objectIdSchema, workflowNameSchema } from "@cydo/auth"
import { z } from "zod"

export const createWorkflowSchema = z.object({
  name: workflowNameSchema,
})

export const updateWorkflowSchema = z.object({
  name: workflowNameSchema,
})

export const listWorkflowsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional(),
})

export const workflowIdParamSchema = z.object({
  id: objectIdSchema,
})

export const workflowVersionParamSchema = z.object({
  id: objectIdSchema,
  version: z.coerce.number().int().min(1),
})

export const listWorkflowVersionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const graphNodeTypeSchema = z.enum([
  "node:trigger",
  "node:agent",
  "node:whatsapp",
  "node:triggerwebhook",
  "node:openai",
  "node:deepseek",
  "node:callapi",
  "node:cydoflow",
  "node:switch",
  "node:note",
  "node:redis",
  "node:scheduletrigger",
  "node:code",
  "node:humanapproval",
  "node:gmail",
  "node:sheets",
  "node:supabase",
  "node:calendar",
  "node:notion",
  "node:triggeronclick",
  "node:wait",
  "node:editfield",
  "node:if",
  "node:telegram",
  "node:postgres",
  "node:mongo",
  "node:airtable",
])

export const graphNodeSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().trim().min(1).max(120),
  createdAt: z.string().min(1).max(40),
  type: graphNodeTypeSchema,
  configuration: z.unknown().optional(),
  nextNode: z.string().max(120).default(""),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
})

export const saveWorkflowGraphSchema = z.object({
  nodes: z.array(graphNodeSchema).max(200),
})

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>
export type ListWorkflowsQuery = z.infer<typeof listWorkflowsQuerySchema>
export type ListWorkflowVersionsQuery = z.infer<typeof listWorkflowVersionsQuerySchema>
export type SaveWorkflowGraphInput = z.infer<typeof saveWorkflowGraphSchema>
export type GraphNodeInput = z.infer<typeof graphNodeSchema>
