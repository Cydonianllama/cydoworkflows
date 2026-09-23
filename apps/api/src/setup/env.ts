import "dotenv/config"
import { z } from "zod"

const booleanish = (defaultValue: "true" | "false") =>
  z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true")

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGO_URI: z.string().min(1, "MONGO_URI es obligatorio"),
  /** Si se define, sobreescribe la base de datos indicada en MONGO_URI. */
  MONGO_DB_NAME: z.string().default(""),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  WEBAPP_URL: z.string().default("http://localhost:5173"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET debe tener al menos 16 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET debe tener al menos 16 caracteres"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  COOKIE_SECURE: booleanish("false"),

  OTP_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),
  OTP_DIGITS: z.coerce.number().int().min(4).max(8).default(6),

  GOOGLE_CLIENT_ID: z.string().default(""),

  RESEND_API_KEY: z.string().default(""),
  RESEND_FROM: z.string().default("Cydo <no-reply@cydo.app>"),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`).join("\n")
  throw new Error(`Configuración de entorno inválida:\n${issues}`)
}

export const env = parsed.data

export const isProduction = env.NODE_ENV === "production"
export const isTest = env.NODE_ENV === "test"
