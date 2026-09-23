import type { AuthUser, CreateUserInput, OtpState, UpdateUserInput, UserRepository } from "@cydo/auth"
import mongoose from "mongoose"
import { RefreshTokenModel, UserModel, toAuthUser, toOtpState } from "../../modules/auth/auth.model"

export class MongoUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() })
    return doc ? toAuthUser(doc) : null
  }

  async findById(id: string): Promise<AuthUser | null> {
    if (!mongoose.isValidObjectId(id)) return null
    const doc = await UserModel.findById(id)
    return doc ? toAuthUser(doc) : null
  }

  async create(input: CreateUserInput): Promise<AuthUser> {
    const doc = await UserModel.create({
      email: input.email.toLowerCase(),
      emailVerified: input.emailVerified,
      provider: input.provider,
      passwordHash: input.passwordHash,
      profile: { name: input.profile.name },
      accountOwnerId: input.accountOwnerId,
      roleInAccount: input.roleInAccount,
      status: "active",
      onboardingCompleted: false,
      otp: null,
    })
    return toAuthUser(doc)
  }

  async update(id: string, patch: UpdateUserInput): Promise<AuthUser | null> {
    if (!mongoose.isValidObjectId(id)) return null

    const set: Record<string, unknown> = {}
    if (patch.emailVerified !== undefined) set.emailVerified = patch.emailVerified
    if (patch.passwordHash !== undefined) set.passwordHash = patch.passwordHash
    if (patch.accountOwnerId !== undefined) set.accountOwnerId = patch.accountOwnerId
    if (patch.roleInAccount !== undefined) set.roleInAccount = patch.roleInAccount
    if (patch.status !== undefined) set.status = patch.status
    if (patch.onboardingCompleted !== undefined) set.onboardingCompleted = patch.onboardingCompleted

    if (patch.profile) {
      for (const [key, value] of Object.entries(patch.profile)) {
        if (value !== undefined) set[`profile.${key}`] = value
      }
    }

    const doc = await UserModel.findByIdAndUpdate(id, { $set: set }, { new: true })
    return doc ? toAuthUser(doc) : null
  }

  async saveOtp(id: string, otp: OtpState | null): Promise<void> {
    if (!mongoose.isValidObjectId(id)) return
    await UserModel.updateOne({ _id: id }, { $set: { otp } })
  }

  async readOtp(id: string): Promise<OtpState | null> {
    if (!mongoose.isValidObjectId(id)) return null
    const doc = await UserModel.findById(id).select("otp")
    return toOtpState(doc?.otp)
  }

  async listMembers(accountOwnerId: string): Promise<AuthUser[]> {
    if (!mongoose.isValidObjectId(accountOwnerId)) return []
    const docs = await UserModel.find({ accountOwnerId }).sort({ createdAt: 1 })
    return docs.map(toAuthUser)
  }

  async deleteById(id: string): Promise<void> {
    if (!mongoose.isValidObjectId(id)) return
    await UserModel.deleteOne({ _id: id })
    await RefreshTokenModel.deleteMany({ userId: id })
  }
}
