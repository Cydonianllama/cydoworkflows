import "dotenv/config"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { UserModel } from "../src/modules/auth/auth.model"
import { connectDb, disconnectDb } from "../src/setup/db"

/**
 * Crea (o actualiza) un usuario ya verificado para entrar sin pasar por el OTP.
 * Uso: pnpm --filter @cydo/api seed:user
 * Personalizable con SEED_EMAIL, SEED_PASSWORD y SEED_NAME.
 */
const EMAIL = (process.env.SEED_EMAIL ?? "admin@cydo.app").toLowerCase()
const PASSWORD = process.env.SEED_PASSWORD ?? "Cydo12345"
const NAME = process.env.SEED_NAME ?? "Cydo Admin"

async function main(): Promise<void> {
  await connectDb()

  const passwordHash = await bcrypt.hash(PASSWORD, 10)
  const existing = await UserModel.findOne({ email: EMAIL })

  if (existing) {
    existing.passwordHash = passwordHash
    existing.emailVerified = true
    existing.provider = "local"
    existing.status = "active"
    await existing.save()
    console.log(`[seed] usuario actualizado: ${EMAIL}`)
  } else {
    await UserModel.create({
      email: EMAIL,
      emailVerified: true,
      provider: "local",
      passwordHash,
      profile: { name: NAME, jobRole: "founder", expectedUsers: 10 },
      accountOwnerId: null,
      roleInAccount: "owner",
      status: "active",
      onboardingCompleted: true,
      otp: null,
    })
    console.log(`[seed] usuario creado: ${EMAIL}`)
  }

  console.log(`[seed] base de datos : ${mongoose.connection.name}`)
  console.log(`[seed] contraseña    : ${PASSWORD}`)

  await disconnectDb()
}

void main().catch(async (error: unknown) => {
  console.error("[seed] error", error)
  await disconnectDb()
  process.exit(1)
})
