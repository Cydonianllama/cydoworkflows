import { z } from "zod"

export const scheduleTriggerConfigSchema = z.object({
  cron: z.string().min(1, "cron es obligatorio"),
  timezone: z.string().min(1).default("UTC"),
})

export const triggerWebhookConfigSchema = z.object({
  token: z.string().min(1).optional(),
})

export type ScheduleTriggerConfigInput = z.infer<typeof scheduleTriggerConfigSchema>
export type WebhookTriggerConfigInput = z.infer<typeof triggerWebhookConfigSchema>
