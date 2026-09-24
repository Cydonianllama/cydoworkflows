import { describe, expect, it } from "vitest"
import { isValidCron, isValidTimezone, nextCronRun } from "../src/server/cron"

describe("cron", () => {
  it("acepta expresiones cron válidas", () => {
    expect(isValidCron("* * * * *")).toBe(true)
    expect(isValidCron("0 3 * * *")).toBe(true)
    expect(isValidCron("*/15 * * * *")).toBe(true)
    expect(isValidCron("0 9 * * 1-5")).toBe(true)
  })

  it("rechaza expresiones cron inválidas", () => {
    expect(isValidCron("")).toBe(false)
    expect(isValidCron("no-es-cron")).toBe(false)
    expect(isValidCron("99 * * * *")).toBe(false)
    expect(isValidCron("* * 99 * *")).toBe(false)
  })

  it("valida timezone", () => {
    expect(isValidTimezone("UTC")).toBe(true)
    expect(isValidTimezone("America/Argentina/Buenos_Aires")).toBe(true)
    expect(isValidTimezone("No/Existe")).toBe(false)
  })

  it("calcula la próxima corrida", () => {
    const from = new Date("2026-01-01T00:00:00.000Z")
    const next = nextCronRun("0 3 * * *", "UTC", from)
    expect(next).not.toBeNull()
    expect(next!.getTime()).toBeGreaterThan(from.getTime())
    expect(next!.toISOString()).toBe("2026-01-01T03:00:00.000Z")
  })

  it("devuelve null ante expresión inválida", () => {
    expect(nextCronRun("no-es-cron", "UTC")).toBeNull()
  })
})
