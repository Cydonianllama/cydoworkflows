import { describe, expect, it } from "vitest"
import { getNodeDefinition, ifNode, triggerOnClickNode, waitNode } from "../nodes"
import type { INode, NodeDefinition } from "../nodes/types"
import { DEFAULT_NODE_EXECUTION, resolveExecutionConfig } from "../nodes/executionDefaults"
import { getNextExecutionIds } from "../utils/nextExecutionIds"

function createNode(id: string, overrides: Partial<INode> = {}): INode {
  return {
    id,
    title: `Nodo ${id}`,
    createdAt: "2026-01-01T00:00:00.000Z",
    type: "node:wait",
    configuration: {},
    nextNode: "",
    ...overrides,
  }
}

describe("getNextExecutionIds", () => {
  it("usa onExecute del trigger onclick", () => {
    const trigger = createNode("t1", { type: "node:triggeronclick", nextNode: "w1" })
    const definition = getNodeDefinition("node:triggeronclick")

    expect(getNextExecutionIds(trigger, definition)).toEqual(["w1"])
  })

  it("devuelve vacío si el trigger onclick no tiene nextNode", () => {
    const trigger = createNode("t1", { type: "node:triggeronclick", nextNode: "" })
    const definition = getNodeDefinition("node:triggeronclick")

    expect(getNextExecutionIds(trigger, definition)).toEqual([])
  })

  it("usa getOutgoingEdges como fallback cuando no hay onExecute", () => {
    const wait = createNode("w1", { type: "node:wait", nextNode: "w2" })
    const definition = getNodeDefinition("node:wait")

    expect(getNextExecutionIds(wait, definition)).toEqual(["w2"])
  })

  it("devuelve vacío sin definición y sin nextNode", () => {
    const orphan = createNode("x", { nextNode: "" })
    expect(getNextExecutionIds(orphan, undefined)).toEqual([])
  })

  it("prefiere onExecute sobre nextNode cuando el resultado está vacío", () => {
    const node = createNode("n1", { type: "node:triggeronclick", nextNode: "ignored" })
    const custom: NodeDefinition = {
      ...triggerOnClickNode,
      onExecute() {
        return { nextNodeIds: [] }
      },
    }

    expect(getNextExecutionIds(node, custom)).toEqual([])
  })
})

describe("resolveExecutionConfig", () => {
  it("usa los defaults cuando execution no está definido", () => {
    const config = resolveExecutionConfig(undefined)

    expect(config.delayMs).toBe(DEFAULT_NODE_EXECUTION.delayMs)
    expect(config.Icon).toBe(DEFAULT_NODE_EXECUTION.Icon)
    expect(config.activeClassName).toBe(DEFAULT_NODE_EXECUTION.activeClassName)
  })

  it("prioriza la configuración de la definición", () => {
    const config = resolveExecutionConfig(triggerOnClickNode.execution)

    expect(config.delayMs).toBe(1200)
    expect(config.Icon).toBe(triggerOnClickNode.execution?.Icon)
  })

  it("merge parcial respeta defaults faltantes", () => {
    const config = resolveExecutionConfig({ delayMs: 500 })

    expect(config.delayMs).toBe(500)
    expect(config.Icon).toBe(DEFAULT_NODE_EXECUTION.Icon)
  })
})

describe("triggerOnClickNode.onExecute", () => {
  it("encadena al nextNode", () => {
    const trigger = createNode("t", { type: "node:triggeronclick", nextNode: "a" })
    expect(triggerOnClickNode.onExecute?.(trigger)).toEqual({ nextNodeIds: ["a"] })
  })

  it("no explota sin nextNode", () => {
    const trigger = createNode("t", { type: "node:triggeronclick", nextNode: "" })
    expect(triggerOnClickNode.onExecute?.(trigger)).toEqual({ nextNodeIds: [] })
  })
})

describe("ifNode", () => {
  it("está registrado", () => {
    expect(getNodeDefinition("node:if")).toBeDefined()
  })

  it("onExecute sigue la rama true si está conectada", () => {
    const node = createNode("if1", {
      type: "node:if",
      configuration: { condition: "a > 1", trueNextNode: "t", falseNextNode: "f" },
    })
    expect(ifNode.onExecute?.(node)).toEqual({ nextNodeIds: ["t"] })
  })

  it("onExecute sigue false si true no está conectada", () => {
    const node = createNode("if1", {
      type: "node:if",
      configuration: { condition: "", trueNextNode: "", falseNextNode: "f" },
    })
    expect(ifNode.onExecute?.(node)).toEqual({ nextNodeIds: ["f"] })
  })

  it("onExecute devuelve vacío sin ramas conectadas", () => {
    const node = createNode("if1", {
      type: "node:if",
      configuration: { condition: "", trueNextNode: "", falseNextNode: "" },
    })
    expect(ifNode.onExecute?.(node)).toEqual({ nextNodeIds: [] })
  })

  it("outgoingEdges arma edges true/false", () => {
    const node = createNode("if1", {
      type: "node:if",
      configuration: { condition: "", trueNextNode: "a", falseNextNode: "b" },
    })
    expect(ifNode.outgoingEdges?.(node)).toEqual([
      { sourceHandle: "true", target: "a" },
      { sourceHandle: "false", target: "b" },
    ])
  })
})

describe("registro de nodos nuevos", () => {
  it("los 6 tipos están en el registry", () => {
    for (const type of [
      "node:editfield",
      "node:if",
      "node:telegram",
      "node:postgres",
      "node:mongo",
      "node:airtable",
    ] as const) {
      expect(getNodeDefinition(type), type).toBeDefined()
    }
  })
})

describe("defs de ejecución", () => {
  it("waitNode no define onExecute (usa outgoingEdges por defecto)", () => {
    expect(waitNode.onExecute).toBeUndefined()
  })

  it("trigger onclick define delay y animación de recarga", () => {
    expect(triggerOnClickNode.execution?.delayMs).toBe(1200)
    expect(triggerOnClickNode.execution?.Icon).toBeDefined()
    expect(triggerOnClickNode.execution?.activeClassName).toContain("emerald")
    expect(triggerOnClickNode.execution?.activeClassName).not.toContain("ring-2")
  })
})
