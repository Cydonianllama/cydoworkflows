import { emailSchema, nameSchema, objectIdSchema, passwordSchema } from "@cydo/auth"
import { z } from "zod"

export const inviteRoleSchema = z.enum(["admin", "member"])

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: inviteRoleSchema.default("member"),
})

export const inviteBatchSchema = z.array(inviteMemberSchema).max(50)

export const memberIdParamSchema = z.object({ id: objectIdSchema })

export const updateMemberRoleSchema = z.object({ role: inviteRoleSchema })

export const restrictMemberSchema = z.object({ restricted: z.boolean() })

export const inviteTokenParamSchema = z.object({ token: z.string().min(16).max(256) })

export const acceptInviteSchema = z.object({
  name: nameSchema,
  password: passwordSchema,
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
