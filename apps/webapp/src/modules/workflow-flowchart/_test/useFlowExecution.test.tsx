import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Node } from "@xyflow/react"
import { useFlowExecution } from "../hooks/useFlowExecution"
import type { INode } from "../nodes/types"

function rfNode(id: string, domain: Partial<INode> = {}): Node {
  const node: INode = {
    id,
    title: id,
    createdAt: "2026-01-01T00:00:00.000Z",
    type: "node:wait",
    configuration: {},
    nextNode: "",
    ...domain,
  }
  return {
    id,
    type: node.type,
    position: { x: 0, y: 0 },
    data: { node },
  }
}

async function flush(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe("useFlowExecution", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("recorre una cadena lineal y termina en idle", async () => {
    const nodes: Node[] = [
      rfNode("t1", { type: "node:triggeronclick", nextNode: "w1" }),
      rfNode("w1", { nextNode: "w2" }),
      rfNode("w2", { nextNode: "" }),
    ]

    const { result } = renderHook(() => useFlowExecution(nodes))

    let startPromise: Promise<void> | undefined
    act(() => {
      startPromise = result.current.start("t1")
    })

    expect(result.current.running).toBe(true)
    expect(result.current.activeNodeId).toBe("t1")

    await flush(1200)
    expect(result.current.activeNodeId).toBe("w1")

    await flush(1000)
    expect(result.current.activeNodeId).toBe("w2")

    await flush(1000)
    expect(result.current.running).toBe(false)
    expect(result.current.activeNodeId).toBeNull()

    await startPromise
  })

  it("no infinite en ciclos", async () => {
    const nodes: Node[] = [
      rfNode("t1", { type: "node:triggeronclick", nextNode: "w1" }),
      rfNode("w1", { nextNode: "t1" }),
    ]

    const { result } = renderHook(() => useFlowExecution(nodes))

    act(() => {
      void result.current.start("t1")
    })

    await flush(60_000)

    expect(result.current.running).toBe(false)
    expect(result.current.activeNodeId).toBeNull()
  })

  it("stop cancela la ejecución", async () => {
    const nodes: Node[] = [
      rfNode("t1", { type: "node:triggeronclick", nextNode: "w1" }),
      rfNode("w1"),
    ]

    const { result } = renderHook(() => useFlowExecution(nodes))

    act(() => {
      void result.current.start("t1")
    })

    expect(result.current.activeNodeId).toBe("t1")

    act(() => {
      result.current.stop()
    })

    expect(result.current.running).toBe(false)
    expect(result.current.activeNodeId).toBeNull()

    await flush(5000)

    expect(result.current.running).toBe(false)
    expect(result.current.activeNodeId).toBeNull()
  })
})
