import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose"

export type InviteStatus = "pending" | "accepted" | "revoked"
export type InviteRole = "admin" | "member"

export interface InviteAttrs {
  email: string
  accountOwnerId: mongoose.Types.ObjectId
  roleInAccount: InviteRole
  tokenHash: string
  expiresAt: Date
  status: InviteStatus
  invitedBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const inviteSchema = new Schema<InviteAttrs>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    accountOwnerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roleInAccount: { type: String, enum: ["admin", "member"], default: "member" },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["pending", "accepted", "revoked"], default: "pending" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

inviteSchema.index({ accountOwnerId: 1, status: 1 })
inviteSchema.index({ email: 1, accountOwnerId: 1, status: 1 })

export const InviteModel: Model<InviteAttrs> =
  (mongoose.models.Invite as Model<InviteAttrs> | undefined) ?? mongoose.model<InviteAttrs>("Invite", inviteSchema)

export interface InviteDTO {
  id: string
  email: string
  roleInAccount: InviteRole
  status: InviteStatus
  expiresAt: string
  createdAt: string
}

export function toInviteDTO(doc: HydratedDocument<InviteAttrs>): InviteDTO {
  return {
    id: doc._id.toString(),
    email: doc.email,
    roleInAccount: doc.roleInAccount,
    status: doc.status,
    expiresAt: doc.expiresAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  }
}
