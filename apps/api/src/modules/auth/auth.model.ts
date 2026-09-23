import type { AuthUser, OtpState, RefreshTokenRecord } from "@cydo/auth"
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose"

export interface UserOtpAttrs {
  hash: string
  expiresAt: Date
  attempts: number
  sentAt: Date
}

export interface UserProfileAttrs {
  name: string
  jobRole?: string | null
  expectedUsers?: number | null
}

export interface UserAttrs {
  email: string
  emailVerified: boolean
  provider: "local" | "google"
  passwordHash: string | null
  profile: UserProfileAttrs
  accountOwnerId: mongoose.Types.ObjectId | null
  roleInAccount: "owner" | "admin" | "member"
  status: "active" | "restricted"
  onboardingCompleted: boolean
  otp: UserOtpAttrs | null
  createdAt: Date
  updatedAt: Date
}

const profileSchema = new Schema<UserProfileAttrs>(
  {
    name: { type: String, required: true, trim: true },
    jobRole: { type: String, default: null },
    expectedUsers: { type: Number, default: null },
  },
  { _id: false },
)

const otpSchema = new Schema<UserOtpAttrs>(
  {
    hash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, required: true },
  },
  { _id: false },
)

const userSchema = new Schema<UserAttrs>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    passwordHash: { type: String, default: null },
    profile: { type: profileSchema, required: true },
    accountOwnerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    roleInAccount: { type: String, enum: ["owner", "admin", "member"], default: "owner" },
    status: { type: String, enum: ["active", "restricted"], default: "active" },
    onboardingCompleted: { type: Boolean, default: false },
    otp: { type: otpSchema, default: null },
  },
  { timestamps: true },
)

userSchema.index({ accountOwnerId: 1, status: 1 })

export const UserModel: Model<UserAttrs> =
  (mongoose.models.User as Model<UserAttrs> | undefined) ?? mongoose.model<UserAttrs>("User", userSchema)

export interface RefreshTokenAttrs {
  userId: mongoose.Types.ObjectId
  tokenHash: string
  familyId: string
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
}

const refreshTokenSchema = new Schema<RefreshTokenAttrs>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

refreshTokenSchema.index({ userId: 1 })
refreshTokenSchema.index({ familyId: 1 })
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshTokenModel: Model<RefreshTokenAttrs> =
  (mongoose.models.RefreshToken as Model<RefreshTokenAttrs> | undefined) ??
  mongoose.model<RefreshTokenAttrs>("RefreshToken", refreshTokenSchema)

export function toAuthUser(doc: HydratedDocument<UserAttrs>): AuthUser {
  return {
    id: doc._id.toString(),
    email: doc.email,
    emailVerified: doc.emailVerified,
    provider: doc.provider,
    passwordHash: doc.passwordHash ?? null,
    profile: {
      name: doc.profile.name,
      jobRole: doc.profile.jobRole ?? null,
      expectedUsers: doc.profile.expectedUsers ?? null,
    },
    accountOwnerId: doc.accountOwnerId ? doc.accountOwnerId.toString() : null,
    roleInAccount: doc.roleInAccount,
    status: doc.status,
    onboardingCompleted: doc.onboardingCompleted,
    createdAt: doc.createdAt,
  }
}

export function toOtpState(otp: UserOtpAttrs | null | undefined): OtpState | null {
  if (!otp) return null
  return {
    hash: otp.hash,
    expiresAt: otp.expiresAt,
    attempts: otp.attempts,
    sentAt: otp.sentAt,
  }
}

export function toRefreshTokenRecord(doc: HydratedDocument<RefreshTokenAttrs>): RefreshTokenRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    tokenHash: doc.tokenHash,
    familyId: doc.familyId,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt ?? null,
  }
}
