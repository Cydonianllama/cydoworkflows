import type { PasswordHasherPort } from "@cydo/auth"
import bcrypt from "bcryptjs"

const SALT_ROUNDS = 10

export class BcryptHasherAdapter implements PasswordHasherPort {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS)
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash)
  }
}
