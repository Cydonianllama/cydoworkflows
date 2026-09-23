import type {
  AuthPorts,
  AuthUser,
  ClockPort,
  CreateUserInput,
  CryptoPort,
  EmailPort,
  OAuthVerifierPort,
  OtpState,
  PasswordHasherPort,
  RefreshTokenRecord,
  RefreshTokenRepository,
  TokenSignerPort,
  UpdateUserInput,
  UserRepository,
  VerifiedOAuthProfile,
} from "@cydo/auth"
import { createHash, randomBytes, randomInt } from "node:crypto"

export interface InMemoryPorts extends AuthPorts {
  sentOtps: Array<{ to: string; code: string }>
  sentInvites: Array<{ to: string; acceptUrl: string }>
  advanceTime(ms: number): void
}

class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, AuthUser>()
  readonly otps = new Map<string, OtpState | null>()
  private sequence = 0

  async findByEmail(email: string): Promise<AuthUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) return user
    }
    return null
  }

  async findById(id: string): Promise<AuthUser | null> {
    return this.users.get(id) ?? null
  }

  async create(input: CreateUserInput): Promise<AuthUser> {
    this.sequence += 1
    const id = `u${this.sequence}`
    const user: AuthUser = {
      id,
      email: input.email.toLowerCase(),
      emailVerified: input.emailVerified,
      provider: input.provider,
      passwordHash: input.passwordHash,
      profile: { name: input.profile.name },
      accountOwnerId: input.accountOwnerId,
      roleInAccount: input.roleInAccount,
      status: "active",
      onboardingCompleted: false,
      createdAt: new Date(),
    }
    this.users.set(id, user)
    return user
  }

  async update(id: string, patch: UpdateUserInput): Promise<AuthUser | null> {
    const current = this.users.get(id)
    if (!current) return null

    const updated: AuthUser = {
      ...current,
      ...(patch.emailVerified !== undefined ? { emailVerified: patch.emailVerified } : {}),
      ...(patch.passwordHash !== undefined ? { passwordHash: patch.passwordHash } : {}),
      ...(patch.accountOwnerId !== undefined ? { accountOwnerId: patch.accountOwnerId } : {}),
      ...(patch.roleInAccount !== undefined ? { roleInAccount: patch.roleInAccount } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.onboardingCompleted !== undefined ? { onboardingCompleted: patch.onboardingCompleted } : {}),
      ...(patch.profile ? { profile: { ...current.profile, ...patch.profile } } : {}),
    }

    this.users.set(id, updated)
    return updated
  }

  async saveOtp(id: string, otp: OtpState | null): Promise<void> {
    this.otps.set(id, otp)
  }

  async readOtp(id: string): Promise<OtpState | null> {
    return this.otps.get(id) ?? null
  }

  async listMembers(accountOwnerId: string): Promise<AuthUser[]> {
    return [...this.users.values()].filter((user) => user.accountOwnerId === accountOwnerId)
  }

  async deleteById(id: string): Promise<void> {
    this.users.delete(id)
  }
}

class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  readonly records = new Map<string, RefreshTokenRecord>()
  private sequence = 0

  async create(record: Omit<RefreshTokenRecord, "id">): Promise<RefreshTokenRecord> {
    this.sequence += 1
    const created: RefreshTokenRecord = { ...record, id: `rt${this.sequence}` }
    this.records.set(created.id, created)
    return created
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    for (const record of this.records.values()) {
      if (record.tokenHash === tokenHash) return record
    }
    return null
  }

  async revoke(id: string): Promise<void> {
    const record = this.records.get(id)
    if (record) this.records.set(id, { ...record, revokedAt: new Date() })
  }

  async revokeFamily(familyId: string): Promise<void> {
    for (const [id, record] of this.records) {
      if (record.familyId === familyId) this.records.set(id, { ...record, revokedAt: new Date() })
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const [id, record] of this.records) {
      if (record.userId === userId) this.records.set(id, { ...record, revokedAt: new Date() })
    }
  }
}

export function createInMemoryPorts(): InMemoryPorts {
  const sentOtps: InMemoryPorts["sentOtps"] = []
  const sentInvites: InMemoryPorts["sentInvites"] = []
  let currentTime = new Date("2026-01-01T00:00:00.000Z")

  const clock: ClockPort = { now: () => new Date(currentTime) }

  const crypto: CryptoPort = {
    randomOtp: (digits) =>
      randomInt(0, 10 ** digits)
        .toString()
        .padStart(digits, "0"),
    randomToken: (bytes) => randomBytes(bytes).toString("hex"),
    sha256: (value) => createHash("sha256").update(value).digest("hex"),
  }

  const hasher: PasswordHasherPort = {
    hash: async (plain) => `hashed:${plain}`,
    compare: async (plain, hash) => hash === `hashed:${plain}`,
  }

  const tokens: TokenSignerPort = {
    signAccess: (payload) => `access:${payload.sub}`,
    verifyAccess: (token) => (token.startsWith("access:") ? { sub: token.slice("access:".length) } : null),
    accessTtlMs: 15 * 60 * 1000,
    refreshTtlMs: 7 * 24 * 60 * 60 * 1000,
  }

  const oauth: OAuthVerifierPort = {
    verifyGoogleIdToken: async (idToken): Promise<VerifiedOAuthProfile | null> =>
      idToken === "google-ok"
        ? { email: "google@cydo.app", name: "Google User", emailVerified: true }
        : null,
  }

  const email: EmailPort = {
    sendOtp: async (to, code) => {
      sentOtps.push({ to, code })
    },
    sendInvite: async (params) => {
      sentInvites.push({ to: params.to, acceptUrl: params.acceptUrl })
    },
  }

  return {
    users: new InMemoryUserRepository(),
    refreshTokens: new InMemoryRefreshTokenRepository(),
    email,
    hasher,
    tokens,
    oauth,
    crypto,
    clock,
    sentOtps,
    sentInvites,
    advanceTime: (ms) => {
      currentTime = new Date(currentTime.getTime() + ms)
    },
  }
}
