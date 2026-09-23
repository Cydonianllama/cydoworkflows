import { z } from "zod"

const envSchema = z.object({
  VITE_API_URL: z.string().min(1).default("http://localhost:4000/api/v1"),
  VITE_GOOGLE_CLIENT_ID: z.string().default(""),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`).join("\n")
  throw new Error(`Variables de entorno inválidas:\n${issues}`)
}

export const env = parsed.data
