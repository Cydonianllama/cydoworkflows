import { nameSchema } from "@cydo/auth"
import { z } from "zod"

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  jobRole: z.string().trim().min(1).max(60).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
