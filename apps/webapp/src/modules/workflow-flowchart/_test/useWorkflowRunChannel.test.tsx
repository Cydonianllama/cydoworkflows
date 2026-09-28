import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const h = vi.hoisted(() => {
  const handlers = new Map<string, Set<(payload: unknown) => void>>()
  const emitted: Array<{ event: string; payload: unknown }> = []

  return {
    handlers,
    emitted,
    socket: {
      connected: false,
      on: (event: string, cb: (payload: unknown) => void) => {
        const set = handlers.get(event) ?? new Set<(payload: unknown) => void>()
        set.add(cb)
        handlers.set(event, set)
      },
      off: (event: string, cb: (payload: unknown) => void) => {
        handlers.get(event)?.delete(cb)
      },
      emit: (event: string, payload: unknown) => {
        emitted.push({ event, payload })
      },
    },
    emitServer: (event: string, payload: unknown) => {
      for (const cb of handlers.get(event) ?? []) cb(payload)
    },
    connectSocket: vi.fn(),
    disconnectSocket: vi.fn(),
    subscribeWorkflow: vi.fn(),
    unsubscribeWorkflow: vi.fn(),
  }
})

vi.mock("@/setup/socketSetup", () => ({
  socket: h.socket,
  connectSocket: h.connectSocket,
  disconnectSocket: h.disconnectSocket,
  subscribeWorkflow: h.subscribeWorkflow,
  unsubscribeWorkflow: h.unsubscribeWorkflow,
}))

import { useWorkflowRunChannel } from "../hooks/useWorkflowRunChannel"

const RUN_ID = "run-1"
const OTHER_RUN_ID = "run-2"

beforeEach(() => {
  vi.clearAllMocks()
  h.handlers.clear()
  h.emitted.length = 0
})

describe("useWorkflowRunChannel", () => {
  it("conecta y se suscribe a la room del workflow al montar", () => {
    const { unmount } = renderHook(() => useWorkflowRunChannel("wf1"))

    expect(h.connectSocket).toHaveBeenCalledTimes(1)
    expect(h.subscribeWorkflow).toHaveBeenCalledWith("wf1")

    unmount()

    expect(h.unsubscribeWorkflow).toHaveBeenCalledWith("wf1")
    expect(h.disconnectSocket).toHaveBeenCalledTimes(1)
  })

  it("resalta el nodo activo al recibir node:started del run seguido", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
    })
    expect(result.current.running).toBe(true)

    act(() => {
      h.emitServer("node:started", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        startedAt: "2026-01-01T00:00:00.000Z",
      })
    })

    expect(result.current.activeNodeId).toBe("n1")
    expect(result.current.running).toBe(true)
  })

  it("ignora los eventos de otros runs", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
    })

    act(() => {
      h.emitServer("node:started", {
        runId: OTHER_RUN_ID,
        nodeId: "n9",
        type: "node:wait",
        startedAt: "2026-01-01T00:00:00.000Z",
      })
    })

    expect(result.current.activeNodeId).toBeNull()
  })

  it("termina el seguimiento al recibir run:finished", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
      h.emitServer("node:started", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        startedAt: "2026-01-01T00:00:00.000Z",
      })
    })

    act(() => {
      h.emitServer("run:finished", {
        runId: RUN_ID,
        workflowId: "wf1",
        status: "success",
        error: null,
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: "2026-01-01T00:00:01.000Z",
        runData: {},
      })
    })

    expect(result.current.running).toBe(false)
    expect(result.current.activeNodeId).toBeNull()
    expect(result.current.runId).toBeNull()
  })

  it("stop deja de seguir el run", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
      result.current.stop()
    })

    act(() => {
      h.emitServer("node:started", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        startedAt: "2026-01-01T00:00:00.000Z",
      })
    })

    expect(result.current.running).toBe(false)
    expect(result.current.activeNodeId).toBeNull()
  })

  it("aplica el node:started que llegó antes de track", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      h.emitServer("node:started", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        startedAt: "2026-01-01T00:00:00.000Z",
      })
    })
    expect(result.current.activeNodeId).toBeNull()

    act(() => {
      result.current.track(RUN_ID)
    })

    expect(result.current.activeNodeId).toBe("n1")
    expect(result.current.running).toBe(true)
  })

  it("no queda colgado si el run termina antes de track", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      h.emitServer("node:started", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        startedAt: "2026-01-01T00:00:00.000Z",
      })
      h.emitServer("run:finished", {
        runId: RUN_ID,
        workflowId: "wf1",
        status: "success",
        error: null,
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: "2026-01-01T00:00:01.000Z",
        runData: {},
      })
    })

    act(() => {
      result.current.track(RUN_ID)
    })

    expect(result.current.running).toBe(false)
    expect(result.current.activeNodeId).toBeNull()
    expect(result.current.runId).toBeNull()
  })

  it("acumula los pasos finalizados con su output", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
    })

    act(() => {
      h.emitServer("node:completed", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        status: "success",
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: "2026-01-01T00:00:01.000Z",
        input: [],
        output: [{ json: { ok: true } }],
        error: null,
      })
    })

    expect(result.current.steps).toHaveLength(1)
    expect(result.current.steps[0]!.nodeId).toBe("n1")
    expect(result.current.steps[0]!.output).toEqual([{ json: { ok: true } }])
  })

  it("marca el nodo como ejecutado al finalizar", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
    })

    act(() => {
      h.emitServer("node:completed", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        status: "success",
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: "2026-01-01T00:00:01.000Z",
        input: [],
        output: [],
        error: null,
      })
    })

    expect(result.current.executedNodes).toEqual({ n1: "success" })
  })

  it("marca error cuando el nodo falla", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
    })

    act(() => {
      h.emitServer("node:failed", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        status: "error",
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: "2026-01-01T00:00:01.000Z",
        input: [],
        output: [],
        error: "boom",
      })
    })

    expect(result.current.executedNodes).toEqual({ n1: "error" })
  })

  it("clearExecuted limpia los nodos indicados y sus pasos", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
      h.emitServer("node:completed", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        status: "success",
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: "2026-01-01T00:00:01.000Z",
        input: [],
        output: [],
        error: null,
      })
    })

    act(() => {
      result.current.clearExecuted(["n1", "n2"])
    })

    expect(result.current.executedNodes).toEqual({})
    expect(result.current.steps).toEqual([])
  })

  it("track resetea el estado ejecutado de un run anterior", () => {
    const { result } = renderHook(() => useWorkflowRunChannel("wf1"))

    act(() => {
      result.current.track(RUN_ID)
      h.emitServer("node:completed", {
        runId: RUN_ID,
        nodeId: "n1",
        type: "node:wait",
        status: "success",
        startedAt: "2026-01-01T00:00:00.000Z",
        finishedAt: "2026-01-01T00:00:01.000Z",
        input: [],
        output: [],
        error: null,
      })
    })
    expect(result.current.executedNodes).toEqual({ n1: "success" })

    act(() => {
      result.current.track(OTHER_RUN_ID)
    })

    expect(result.current.executedNodes).toEqual({})
  })
})
