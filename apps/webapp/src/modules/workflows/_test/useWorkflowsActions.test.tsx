import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createWorkflowRequest,
  deleteWorkflowRequest,
  listWorkflowsRequest,
} from "@/lib/api/workflows"
import { useWorkflowsActions } from "../actions/useWorkflowsActions"
import { WorkflowsStoreProvider, useWorkflowsStore } from "../store"
import type { WorkflowDTO } from "@/lib/api/workflows"

vi.mock("@/lib/api/workflows", () => ({
  listWorkflowsRequest: vi.fn(),
  createWorkflowRequest: vi.fn(),
  deleteWorkflowRequest: vi.fn(),
}))

const mockedList = vi.mocked(listWorkflowsRequest)
const mockedCreate = vi.mocked(createWorkflowRequest)
const mockedDelete = vi.mocked(deleteWorkflowRequest)

const workflow = (id: string, name: string): WorkflowDTO => ({
  id,
  name,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  status: "draft",
  version: 0,
  publishedAt: null,
  hasUnpublishedChanges: false,
})

const pagination = {
  page: 1,
  limit: 10,
  total: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}

function wrapper({ children }: { children: ReactNode }) {
  return <WorkflowsStoreProvider>{children}</WorkflowsStoreProvider>
}

function useHarness() {
  return { actions: useWorkflowsActions(), store: useWorkflowsStore() }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useWorkflowsActions", () => {
  it("carga y guarda los workflows cuando la respuesta es válida", async () => {
    mockedList.mockResolvedValue({
      status: true,
      data: { items: [workflow("w1", "Alta de clientes")] },
      pagination,
    })

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.fetchWorkflowsAction({ page: 1 })
    })

    expect(result.current.store.items).toHaveLength(1)
    expect(result.current.store.items[0]?.name).toBe("Alta de clientes")
    expect(result.current.store.pagination?.total).toBe(1)
    expect(result.current.store.loading).toBe(false)
  })

  it("es resiliente cuando la API devuelve null", async () => {
    mockedList.mockResolvedValue(null)

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.fetchWorkflowsAction()
    })

    expect(result.current.store.items).toEqual([])
    expect(result.current.store.loading).toBe(false)
  })

  it("es resiliente cuando la respuesta no trae data.items", async () => {
    mockedList.mockResolvedValue({
      status: true,
      data: {} as { items: WorkflowDTO[] },
    })

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.fetchWorkflowsAction()
    })

    expect(result.current.store.items).toEqual([])
  })

  it("no crea el workflow cuando status es false", async () => {
    mockedCreate.mockResolvedValue({ status: false, data: { workflow: workflow("w1", "x") }, message: "Duplicado" })

    const { result } = renderHook(useHarness, { wrapper })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.createWorkflowAction("x")
    })

    expect(ok).toBe(false)
    expect(mockedList).not.toHaveBeenCalled()
    expect(result.current.store.creating).toBe(false)
  })

  it("refresca la lista después de crear", async () => {
    mockedCreate.mockResolvedValue({ status: true, data: { workflow: workflow("w1", "Nuevo") } })
    mockedList.mockResolvedValue({ status: true, data: { items: [workflow("w1", "Nuevo")] }, pagination })

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.createWorkflowAction("Nuevo")
    })

    await waitFor(() => expect(mockedList).toHaveBeenCalledTimes(1))
    expect(result.current.store.items[0]?.name).toBe("Nuevo")
  })

  it("elimina el workflow localmente cuando la API confirma", async () => {
    mockedList.mockResolvedValue({ status: true, data: { items: [workflow("w1", "Uno")] }, pagination })
    mockedDelete.mockResolvedValue({ status: true, data: { id: "w1" } })

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.fetchWorkflowsAction()
    })
    expect(result.current.store.items).toHaveLength(1)

    await act(async () => {
      await result.current.actions.deleteWorkflowAction("w1")
    })

    expect(result.current.store.items).toHaveLength(0)
    expect(result.current.store.deletingId).toBeNull()
  })
})
