import { describe, expect, it } from "vitest"
import type { TriggerRegistration } from "../src/core/models"
import { ENGINE_ERROR, EngineError } from "../src/core/errors"
import type { ClockPort, CryptoPort, TriggerRegistryPort } from "../src/core/contracts/ports"
import { WorkflowTriggerEngine } from "../src/server/WorkflowTriggerEngine"

class MemoryRegistry implements TriggerRegistryPort {
  store = new Map<string, TriggerRegistration[]>()

  async replaceForWorkflow(workflowId: string, registrations: TriggerRegistration[]): Promise<void> {
    this.store.set(workflowId, registrations)
  }

  async removeForWorkflow(workflowId: string): Promise<void> {
    this.store.delete(workflowId)
  }

  async listCronTriggers(): Promise<TriggerRegistration[]> {
    return [...this.store.values()].flat().filter((reg) => reg.kind === "cron")
  }

  async findByWebhookToken(token: string): Promise<TriggerRegistration | null> {
    return (
      [...this.store.values()]
        .flat()
        .find((reg) => reg.kind === "webhook" && reg.webhookToken === token) ?? null
    )
  }
}

const fixedClock: ClockPort = { now: () => new Date("2026-01-01T00:00:00.000Z") }
const fixedCrypto: CryptoPort = { randomToken: (bytes) => "t".repeat(bytes * 2) }

function createEngine() {
  const registry = new MemoryRegistry()
  const engine = new WorkflowTriggerEngine({ registry, crypto: fixedCrypto, clock: fixedClock })
  return { engine, registry }
}

const workflow = { workflowId: "w1", ownerId: "u1", version: 3 }

describe("WorkflowTriggerEngine.extractTriggers", () => {
  it("ignora los nodos que no son triggers", () => {
    const { engine } = createEngine()
    const triggers = engine.extractTriggers(workflow, [
      { id: "n1", type: "node:openai" },
      { id: "n2", type: "node:switch" },
      { id: "n3", type: "node:note" },
    ])
    expect(triggers).toEqual([])
  })

  it("extrae trigger de schedule con nextRunAt", () => {
    const { engine } = createEngine()
    const [trigger] = engine.extractTriggers(workflow, [
      { id: "n1", type: "node:scheduletrigger", configuration: { cron: "0 3 * * *", timezone: "UTC" } },
    ])
    expect(trigger).toMatchObject({
      kind: "cron",
      cron: "0 3 * * *",
      timezone: "UTC",
      nodeId: "n1",
      workflowId: "w1",
      version: 3,
    })
    expect(trigger!.kind === "cron" && trigger.nextRunAt).toBeInstanceOf(Date)
  })

  it("genera token para webhook sin configuración", () => {
    const { engine } = createEngine()
    const [trigger] = engine.extractTriggers(workflow, [
      { id: "n1", type: "node:triggerwebhook", configuration: {} },
    ])
    expect(trigger).toMatchObject({ kind: "webhook", webhookToken: "t".repeat(32) })
  })

  it("conserva el token existente del webhook", () => {
    const { engine } = createEngine()
    const [trigger] = engine.extractTriggers(workflow, [
      { id: "n1", type: "node:triggerwebhook", configuration: { token: "abc123" } },
    ])
    expect(trigger).toMatchObject({ kind: "webhook", webhookToken: "abc123" })
  })

  it("extrae trigger manual", () => {
    const { engine } = createEngine()
    const [trigger] = engine.extractTriggers(workflow, [{ id: "n1", type: "node:triggeronclick" }])
    expect(trigger).toMatchObject({ kind: "manual", nodeId: "n1" })
  })

  it("tira INVALID_CRON con cron inválido", () => {
    const { engine } = createEngine()
    expect(() =>
      engine.extractTriggers(workflow, [
        { id: "n1", type: "node:scheduletrigger", configuration: { cron: "nope", timezone: "UTC" } },
      ]),
    ).toThrow(EngineError)
    try {
      engine.extractTriggers(workflow, [
        { id: "n1", type: "node:scheduletrigger", configuration: { cron: "nope", timezone: "UTC" } },
      ])
    } catch (error) {
      expect(EngineError.is(error) && error.code).toBe(ENGINE_ERROR.INVALID_CRON)
    }
  })

  it("tira INVALID_TIMEZONE con timezone inexistente", () => {
    const { engine } = createEngine()
    try {
      engine.extractTriggers(workflow, [
        { id: "n1", type: "node:scheduletrigger", configuration: { cron: "* * * * *", timezone: "Fake/Zone" } },
      ])
      expect.unreachable()
    } catch (error) {
      expect(EngineError.is(error) && error.code).toBe(ENGINE_ERROR.INVALID_TIMEZONE)
    }
  })
})

describe("WorkflowTriggerEngine.validateNode", () => {
  it("devuelve null cuando el nodo es válido", () => {
    const { engine } = createEngine()
    expect(
      engine.validateNode({ id: "n1", type: "node:scheduletrigger", configuration: { cron: "0 3 * * *" } }),
    ).toBeNull()
  })

  it("devuelve EngineError cuando el nodo es inválido", () => {
    const { engine } = createEngine()
    const error = engine.validateNode({
      id: "n1",
      type: "node:scheduletrigger",
      configuration: { cron: "nope" },
    })
    expect(error).toBeInstanceOf(EngineError)
    expect(error?.code).toBe(ENGINE_ERROR.INVALID_CRON)
  })

  it("devuelve null para nodos que no son triggers", () => {
    const { engine } = createEngine()
    expect(engine.validateNode({ id: "n1", type: "node:openai" })).toBeNull()
  })
})

describe("WorkflowTriggerEngine.syncWorkflowTriggers", () => {
  it("persiste los triggers del workflow", async () => {
    const { engine, registry } = createEngine()
    const registrations = await engine.syncWorkflowTriggers(workflow, [
      { id: "n1", type: "node:scheduletrigger", configuration: { cron: "*/5 * * * *" } },
      { id: "n2", type: "node:triggerwebhook", configuration: {} },
      { id: "n3", type: "node:callapi" },
    ])
    expect(registrations).toHaveLength(2)
    expect(registry.store.get("w1")).toHaveLength(2)
  })

  it("reemplaza los triggers anteriores (publish de nuevo)", async () => {
    const { engine, registry } = createEngine()
    await engine.syncWorkflowTriggers(workflow, [
      { id: "n1", type: "node:triggerwebhook", configuration: { token: "viejo" } },
    ])
    await engine.syncWorkflowTriggers(workflow, [
      { id: "n9", type: "node:triggerwebhook", configuration: { token: "nuevo" } },
    ])
    const stored = registry.store.get("w1")
    expect(stored).toHaveLength(1)
    expect(stored![0]).toMatchObject({ nodeId: "n9", webhookToken: "nuevo" })
  })

  it("borra los triggers si el grafo ya no tiene ninguno", async () => {
    const { engine, registry } = createEngine()
    await engine.syncWorkflowTriggers(workflow, [
      { id: "n1", type: "node:triggerwebhook", configuration: {} },
    ])
    await engine.syncWorkflowTriggers(workflow, [{ id: "n2", type: "node:openai" }])
    expect(registry.store.get("w1")).toEqual([])
  })
})

describe("WorkflowTriggerEngine.resolveWebhook", () => {
  it("resuelve el trigger registrado por token", async () => {
    const { engine } = createEngine()
    await engine.syncWorkflowTriggers(workflow, [
      { id: "n1", type: "node:triggerwebhook", configuration: { token: "secreto" } },
    ])
    const registration = await engine.resolveWebhook("secreto")
    expect(registration).toMatchObject({ kind: "webhook", nodeId: "n1", workflowId: "w1" })
  })

  it("tira TRIGGER_NOT_FOUND con token desconocido", async () => {
    const { engine } = createEngine()
    await expect(engine.resolveWebhook("otro")).rejects.toMatchObject({
      code: ENGINE_ERROR.TRIGGER_NOT_FOUND,
    })
  })
})

describe("WorkflowTriggerEngine.removeTriggers", () => {
  it("elimina los registros del workflow", async () => {
    const { engine, registry } = createEngine()
    await engine.syncWorkflowTriggers(workflow, [
      { id: "n1", type: "node:triggerwebhook", configuration: {} },
    ])
    await engine.removeTriggers("w1")
    expect(registry.store.has("w1")).toBe(false)
  })
})
