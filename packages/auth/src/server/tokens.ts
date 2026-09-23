import type { ClockPort, CryptoPort, RefreshTokenRecord, TokenSignerPort } from "../core/contracts/ports"

export interface IssuedRefreshToken {
  token: string
  record: Omit<RefreshTokenRecord, "id">
}

export function issueRefreshToken(
  crypto: CryptoPort,
  clock: ClockPort,
  signer: TokenSignerPort,
  userId: string,
  familyId: string,
): IssuedRefreshToken {
  const token = crypto.randomToken(48)
  return {
    token,
    record: {
      userId,
      tokenHash: crypto.sha256(token),
      familyId,
      expiresAt: new Date(clock.now().getTime() + signer.refreshTtlMs),
      revokedAt: null,
    },
  }
}

export function newFamilyId(crypto: CryptoPort): string {
  return crypto.randomToken(16)
}
