import { AUTH_ERROR, AuthError } from "@cydo/auth"
import { AuthService } from "@cydo/auth/server"
import { describe, expect, it } from "vitest"
import { createInMemoryPorts, type InMemoryPorts } from "./inMemoryPorts"

const config = {
  otpTtlMs: 60_000,
  otpMaxAttempts: 3,
  otpResendCooldownMs: 0,
  otpDigits: 6,
}

function setup(): { ports: InMemoryPorts; service: AuthService } {
  const ports = createInMemoryPorts()
  return { ports, service: new AuthService(ports, config) }
}

async function registerAndVerify(service: AuthService, ports: InMemoryPorts, email = "ada@cydo.app") {
  await service.register({ name: "Ada", email, password: "supersecret" })
  const code = ports.sentOtps.at(-1)?.code ?? ""
  return service.verifyOtp({ email, code })
}

describe("AuthService", () => {
  it("registra al usuario y envía un OTP por email", async () => {
    const { ports, service } = setup()

    const result = await service.register({ name: "Ada", email: "Ada@Cydo.app", password: "supersecret" })

    expect(result).toEqual({ requiresOtp: true, email: "ada@cydo.app" })
    expect(ports.sentOtps).toHaveLength(1)
    expect(ports.sentOtps[0]?.code).toMatch(/^\d{6}$/)
    expect(ports.sentOtps[0]?.to).toBe("ada@cydo.app")
  })

  it("verifica el OTP y emite una sesión", async () => {
    const { ports, service } = setup()
    const session = await registerAndVerify(service, ports)

    expect(session.user.emailVerified).toBe(true)
    expect(session.user.onboardingCompleted).toBe(false)
    expect(session.user.roleInAccount).toBe("owner")
    expect(session.tokens.accessToken).toBe(`access:${session.user.id}`)
    expect(session.tokens.refreshToken).toHaveLength(96)
  })

  it("rechaza el registro si el email ya está verificado", async () => {
    const { ports, service } = setup()
    await registerAndVerify(service, ports)

    await expect(
      service.register({ name: "Ada", email: "ada@cydo.app", password: "otra-clave" }),
    ).rejects.toMatchObject({ code: AUTH_ERROR.EMAIL_TAKEN })
  })

  it("bloquea al superar los intentos de OTP", async () => {
    const { ports, service } = setup()
    await service.register({ name: "Ada", email: "ada@cydo.app", password: "supersecret" })

    await expect(service.verifyOtp({ email: "ada@cydo.app", code: "000000" })).rejects.toBeInstanceOf(AuthError)
    await expect(service.verifyOtp({ email: "ada@cydo.app", code: "000000" })).rejects.toBeInstanceOf(AuthError)
    await expect(service.verifyOtp({ email: "ada@cydo.app", code: "000000" })).rejects.toBeInstanceOf(AuthError)

    await expect(service.verifyOtp({ email: "ada@cydo.app", code: "000000" })).rejects.toMatchObject({
      code: AUTH_ERROR.OTP_ATTEMPTS_EXCEEDED,
    })
  })

  it("rechaza el OTP expirado", async () => {
    const { ports, service } = setup()
    await service.register({ name: "Ada", email: "ada@cydo.app", password: "supersecret" })
    const code = ports.sentOtps.at(-1)?.code ?? ""

    ports.advanceTime(61_000)

    await expect(service.verifyOtp({ email: "ada@cydo.app", code })).rejects.toMatchObject({
      code: AUTH_ERROR.OTP_EXPIRED,
    })
  })

  it("exige email verificado para iniciar sesión", async () => {
    const { service } = setup()
    await service.register({ name: "Ada", email: "ada@cydo.app", password: "supersecret" })

    await expect(service.login({ email: "ada@cydo.app", password: "supersecret" })).rejects.toMatchObject({
      code: AUTH_ERROR.EMAIL_NOT_VERIFIED,
    })
  })

  it("inicia sesión con credenciales válidas", async () => {
    const { ports, service } = setup()
    await registerAndVerify(service, ports)

    const session = await service.login({ email: "ada@cydo.app", password: "supersecret" })
    expect(session.user.email).toBe("ada@cydo.app")

    await expect(service.login({ email: "ada@cydo.app", password: "mala" })).rejects.toMatchObject({
      code: AUTH_ERROR.INVALID_CREDENTIALS,
    })
  })

  it("rota el refresh token y detecta el reuso", async () => {
    const { ports, service } = setup()
    const session = await registerAndVerify(service, ports)
    const firstRefresh = session.tokens.refreshToken

    const rotated = await service.refresh(firstRefresh)
    expect(rotated.tokens.refreshToken).not.toBe(firstRefresh)

    // Reutilizar el token ya rotado revoca toda la familia.
    await expect(service.refresh(firstRefresh)).rejects.toMatchObject({ code: AUTH_ERROR.INVALID_TOKEN })
    await expect(service.refresh(rotated.tokens.refreshToken)).rejects.toMatchObject({
      code: AUTH_ERROR.INVALID_TOKEN,
    })
  })

  it("revoca la sesión al hacer logout", async () => {
    const { ports, service } = setup()
    const session = await registerAndVerify(service, ports)

    await service.logout(session.tokens.refreshToken)

    await expect(service.refresh(session.tokens.refreshToken)).rejects.toMatchObject({
      code: AUTH_ERROR.INVALID_TOKEN,
    })
  })

  it("crea la cuenta desde un idToken de Google", async () => {
    const { service } = setup()

    const session = await service.loginWithGoogle({ idToken: "google-ok" })

    expect(session.user.provider).toBe("google")
    expect(session.user.emailVerified).toBe(true)
    expect(session.user.roleInAccount).toBe("owner")

    await expect(service.loginWithGoogle({ idToken: "invalido" })).rejects.toMatchObject({
      code: AUTH_ERROR.OAUTH_FAILED,
    })
  })

  it("completa el onboarding del dueño", async () => {
    const { ports, service } = setup()
    const session = await registerAndVerify(service, ports)

    const user = await service.completeOnboarding(session.user.id, { jobRole: "founder", expectedUsers: 12 })

    expect(user.onboardingCompleted).toBe(true)
    expect(user.profile.jobRole).toBe("founder")
    expect(user.profile.expectedUsers).toBe(12)
    expect(user.profile.name).toBe("Ada")
  })
})
