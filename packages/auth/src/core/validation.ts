import { z } from "zod"

export const emailSchema = z
  .string()
  .trim()
  .min(1, "El email es obligatorio")
  .email("Email inválido")
  .transform((value) => value.toLowerCase())

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga")

export const nameSchema = z.string().trim().min(2, "El nombre es demasiado corto").max(80)

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, "Código OTP inválido")

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
})

export const resendOtpSchema = z.object({ email: emailSchema })

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
})

export const googleLoginSchema = z.object({ idToken: z.string().min(1) })

export const completeOnboardingSchema = z.object({
  jobRole: z.string().trim().min(1, "El rol es obligatorio").max(60),
  expectedUsers: z.number().int().min(1, "Debe invitar al menos a 1 usuario").max(10_000),
  invites: z
    .array(
      z.object({
        email: emailSchema,
        role: z.enum(["admin", "member"]).default("member"),
      }),
    )
    .max(50)
    .optional(),
})

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Identificador inválido")

export const workflowNameSchema = z.string().trim().min(1, "El nombre es obligatorio").max(120)

export type RegisterInput = z.infer<typeof registerSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>
