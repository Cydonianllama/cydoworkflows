import type { CryptoPort } from "@cydo/auth"
import { createHash, randomBytes, randomInt } from "node:crypto"

export class NodeCryptoAdapter implements CryptoPort {
  randomOtp(digits: number): string {
    return randomInt(0, 10 ** digits)
      .toString()
      .padStart(digits, "0")
  }

  randomToken(bytes: number): string {
    return randomBytes(bytes).toString("hex")
  }

  sha256(value: string): string {
    return createHash("sha256").update(value).digest("hex")
  }
}
