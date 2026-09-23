import type { RefreshTokenRecord, RefreshTokenRepository } from "@cydo/auth"
import { RefreshTokenModel, toRefreshTokenRecord } from "../../modules/auth/auth.model"

export class MongoRefreshTokenRepository implements RefreshTokenRepository {
  async create(record: Omit<RefreshTokenRecord, "id">): Promise<RefreshTokenRecord> {
    const doc = await RefreshTokenModel.create({
      userId: record.userId,
      tokenHash: record.tokenHash,
      familyId: record.familyId,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
    })
    return toRefreshTokenRecord(doc)
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const doc = await RefreshTokenModel.findOne({ tokenHash })
    return doc ? toRefreshTokenRecord(doc) : null
  }

  async revoke(id: string): Promise<void> {
    await RefreshTokenModel.updateOne({ _id: id }, { $set: { revokedAt: new Date() } })
  }

  async revokeFamily(familyId: string): Promise<void> {
    await RefreshTokenModel.updateMany({ familyId, revokedAt: null }, { $set: { revokedAt: new Date() } })
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } })
  }
}
