import { describe, expect, it, vi } from "vitest"
import { PIPELINE_ERROR } from "../src/core/errors"
import type { NodeExecutorRegistry, PipelineInput, PipelineNode, RunContext } from "../src/core/types"
import type { RunEvents } from "../src/core/events"
import { PipelineRunner } from "../src/server/PipelineRunner"

function node(id: string, nextNode = "", type = "node:code"): PipelineNode {
  return { id, type, configuration: {}, nextNode }
}

function createContext(): RunContext {
  return {
    workflowId: "w1",
    version: 2,
    trigger: { kind: "manual", nodeId: "n1" },
    variables: { input: "hola" },
  }
}

function createInput(nodes: PipelineNode[], startNodeId: string): PipelineInput {
  return { nodes, startNodeId, context: createContext() }
}

describe("PipelineRunner recorrido", () => {
  it("recorre una cadena lineal por nextNode", async () => {
    const runner = new PipelineRunner()
    const result = await runner.run(
      createInput([node("a", "b"), node("b", "c"), node("c")], "a"),
    )
    expect(result.status).toBe("success")
    expect(result.steps.map((step) => step.nodeId)).toEqual(["a", "b", "c"])
    expect(result.error).toBeNull()
  })

  it("sigue nextNode aunque no haya executor registrado", async () => {
    const runner = new PipelineRunner({})
    const result = await runner.run(createInput([node("a", "b"), node("b")], "a"))
    expect(result.status).toBe("success")
    expect(result.steps).toHaveLength(2)
  })

  it("usa los executors inyectados por DI", async () => {
    const executor = vi.fn(() => ({ nextNodeIds: ["x"] }))
    const registry: NodeExecutorRegistry = { "node:callapi": executor }
    const runner = new PipelineRunner(registry)
    const result = await runner.run(
      createInput(
        [node("a", "", "node:callapi"), node("x")],
        "a",
      ),
    )
    expect(result.status).toBe("success")
    expect(executor).toHaveBeenCalledTimes(1)
    expect(result.steps.map((step) => step.nodeId)).toEqual(["a", "x"])
  })

  it("bifurca cuando el executor devuelve nextNodeIds y no repite visitados", async () => {
    const registry: NodeExecutorRegistry = {
      "node:switch": () => ({ nextNodeIds: ["b", "c"] }),
      "node:note": () => ({ nextNodeIds: ["b"] }),
    }
    const runner = new PipelineRunner(registry)
    const result = await runner.run(
      createInput(
        [node("a", "", "node:switch"), node("b"), node("c", "", "node:note")],
        "a",
      ),
    )
    expect(result.status).toBe("success")
    expect(result.steps.map((step) => step.nodeId)).toEqual(["a", "b", "c"])
  })

  it("no entra en bucle con grafos cíclicos", async () => {
    const runner = new PipelineRunner()
    const result = await runner.run(createInput([node("a", "b"), node("b", "a")], "a"))
    expect(result.status).toBe("success")
    expect(result.steps.map((step) => step.nodeId)).toEqual(["a", "b"])
  })

  it("saltea nodos inexistentes intermedios", async () => {
    const runner = new PipelineRunner()
    const result = await runner.run(createInput([node("a", "fantasma")], "a"))
    expect(result.status).toBe("success")
    expect(result.steps.map((step) => step.nodeId)).toEqual(["a"])
  })

  it("falla con NODE_NOT_FOUND si el nodo de entrada no existe", async () => {
    const runner = new PipelineRunner()
    const result = await runner.run(createInput([node("a")], "no-existe"))
    expect(result.status).toBe("failed")
    expect(result.error).toContain(PIPELINE_ERROR.NODE_NOT_FOUND)
    expect(result.steps).toEqual([])
  })

  it("respeta el límite de pasos", async () => {
    const nodes = Array.from({ length: 10 }, (_, index) =>
      node(`n${index}`, index < 9 ? `n${index + 1}` : ""),
    )
    const runner = new PipelineRunner({}, { maxSteps: 4 })
    const result = await runner.run(createInput(nodes, "n0"))
    expect(result.status).toBe("limit")
    expect(result.error).toContain(PIPELINE_ERROR.RUN_LIMIT_REACHED)
    expect(result.steps).toHaveLength(4)
  })
})

describe("PipelineRunner errores", () => {
  it("detiene el run cuando un executor lanza error", async () => {
    const executor = vi.fn(() => {
      throw new Error("boom")
    })
    const runner = new PipelineRunner({ "node:code": executor })
    const result = await runner.run(createInput([node("a", "b"), node("b", "c"), node("c")], "a"))
    expect(result.status).toBe("failed")
    expect(result.error).toBe("boom")
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0]).toMatchObject({ nodeId: "a", status: "error", error: "boom" })
    expect(executor).toHaveBeenCalledTimes(1)
  })

  it("emite onNodeError y no onNodeComplete en el paso fallido", async () => {
    const onNodeComplete = vi.fn()
    const onNodeError = vi.fn()
    const runner = new PipelineRunner({
      "node:code": () => {
        throw new Error("fallo")
      },
    })
    await runner.run(createInput([node("a")], "a"), { onNodeComplete, onNodeError } satisfies RunEvents)
    expect(onNodeError).toHaveBeenCalledTimes(1)
    expect(onNodeComplete).not.toHaveBeenCalled()
  })
})

describe("PipelineRunner cancelación", () => {
  it("devuelve cancelled si la señal ya está abortada", async () => {
    const controller = new AbortController()
    controller.abort()
    const runner = new PipelineRunner()
    const result = await runner.run(
      createInput([node("a", "b"), node("b")], "a"),
      {},
      controller.signal,
    )
    expect(result.status).toBe("cancelled")
    expect(result.error).toContain(PIPELINE_ERROR.RUN_CANCELLED)
    expect(result.steps).toEqual([])
  })
})

describe("PipelineRunner eventos", () => {
  it("emite los eventos en orden durante la ejecución", async () => {
    const calls: string[] = []
    const events: RunEvents = {
      onRunStart: () => {
        calls.push("run:start")
      },
      onNodeStart: ({ nodeId }) => {
        calls.push(`node:start:${nodeId}`)
      },
      onNodeComplete: ({ nodeId }) => {
        calls.push(`node:complete:${nodeId}`)
      },
      onRunFinish: ({ status }) => {
        calls.push(`run:finish:${status}`)
      },
    }
    const runner = new PipelineRunner()
    await runner.run(createInput([node("a", "b"), node("b")], "a"), events)
    expect(calls).toEqual([
      "run:start",
      "node:start:a",
      "node:complete:a",
      "node:start:b",
      "node:complete:b",
      "run:finish:success",
    ])
  })

  it("entrega el contexto del run al executor", async () => {
    const executor = vi.fn()
    const runner = new PipelineRunner({ "node:code": executor })
    await runner.run(createInput([node("a")], "a"))
    const [, execution] = executor.mock.calls[0]!
    expect(execution.context.workflowId).toBe("w1")
    expect(execution.context.trigger.kind).toBe("manual")
    expect(execution.signal).toBeInstanceOf(AbortSignal)
  })

  it("registra el output devuelto por el executor", async () => {
    const runner = new PipelineRunner({
      "node:code": () => ({ output: { ok: true } }),
    })
    const result = await runner.run(createInput([node("a")], "a"))
    expect(result.steps[0]!.output).toEqual({ ok: true })
  })
})
