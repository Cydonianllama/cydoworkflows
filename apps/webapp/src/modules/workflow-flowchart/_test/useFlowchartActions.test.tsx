import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Node } from "@xyflow/react"
import {
  getWorkflowGraphRequest,
  getWorkflowRequest,
  listWorkflowVersionsRequest,
  publishWorkflowRequest,
  restoreWorkflowVersionRequest,
  revertWorkflowRequest,
  saveWorkflowGraphRequest,
  updateWorkflowRequest,
  type GetWorkflowGraphResponseDTO,
  type GetWorkflowResponseDTO,
  type SaveWorkflowGraphResponseDTO,
  type UpdateWorkflowResponseDTO,
  type WorkflowDTO,
  type WorkflowVersionSummaryDTO,
} from "@/lib/api/workflows"
import { useFlowchartActions } from "../actions/useFlowchartActions"
import { FlowchartStoreProvider, useFlowchartStore } from "../store"
import { nodesToEdges } from "../utils/nodesToEdges"

vi.mock("@/lib/api/workflows", () => ({
  getWorkflowGraphRequest: vi.fn(),
  getWorkflowRequest: vi.fn(),
  saveWorkflowGraphRequest: vi.fn(),
  updateWorkflowRequest: vi.fn(),
  publishWorkflowRequest: vi.fn(),
  listWorkflowVersionsRequest: vi.fn(),
  restoreWorkflowVersionRequest: vi.fn(),
  revertWorkflowRequest: vi.fn(),
}))

const mockedGet = vi.mocked(getWorkflowGraphRequest)
const mockedSave = vi.mocked(saveWorkflowGraphRequest)
const mockedGetWorkflow = vi.mocked(getWorkflowRequest)
const mockedUpdateWorkflow = vi.mocked(updateWorkflowRequest)
const mockedPublish = vi.mocked(publishWorkflowRequest)
const mockedListVersions = vi.mocked(listWorkflowVersionsRequest)
const mockedRestore = vi.mocked(restoreWorkflowVersionRequest)
const mockedRevert = vi.mocked(revertWorkflowRequest)

const workflowDto = (overrides: Partial<WorkflowDTO> = {}): WorkflowDTO => ({
  id: "w1",
  name: "Mi flow",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  status: "draft",
  version: 0,
  publishedAt: null,
  hasUnpublishedChanges: false,
  ...overrides,
})

const graphResponse = (): GetWorkflowGraphResponseDTO => ({
  graph: {
    workflowId: "w1",
    nodes: [
      {
        id: "n1",
        title: "Trigger",
        createdAt: "2026-01-01T00:00:00.000Z",
        type: "node:trigger",
        configuration: {},
        nextNode: "n2",
        position: { x: 80, y: 120 },
      },
      {
        id: "n2",
        title: "Agente",
        createdAt: "2026-01-01T00:00:00.000Z",
        type: "node:agent",
        configuration: { prompt: "" },
        nextNode: "",
        position: { x: 360, y: 120 },
      },
    ],
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
})

function wrapper({ children }: { children: ReactNode }) {
  return <FlowchartStoreProvider>{children}</FlowchartStoreProvider>
}

function useHarness() {
  return { actions: useFlowchartActions(), store: useFlowchartStore() }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe("useFlowchartActions", () => {
  it("carga el nombre del workflow", async () => {
    const workflowResponse: GetWorkflowResponseDTO = {
      workflow: workflowDto({ name: "Mi flow" }),
    }
    mockedGetWorkflow.mockResolvedValue({ status: true, data: workflowResponse })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    await act(async () => {
      await result.current.actions.loadWorkflowAction()
    })

    expect(result.current.store.workflowName).toBe("Mi flow")
    expect(result.current.store.status).toBe("draft")
    expect(result.current.store.version).toBe(0)
    expect(mockedGetWorkflow).toHaveBeenCalledWith("w1")
  })

  it("carga el meta de un workflow publicado con cambios", async () => {
    mockedGetWorkflow.mockResolvedValue({
      status: true,
      data: {
        workflow: workflowDto({
          status: "published",
          version: 3,
          publishedAt: "2026-01-02T00:00:00.000Z",
          hasUnpublishedChanges: true,
        }),
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    await act(async () => {
      await result.current.actions.loadWorkflowAction()
    })

    expect(result.current.store.status).toBe("published")
    expect(result.current.store.version).toBe(3)
    expect(result.current.store.hasUnpublishedChanges).toBe(true)
  })

  it("renombra el workflow y actualiza el store", async () => {
    const renameResponse: UpdateWorkflowResponseDTO = {
      workflow: workflowDto({ name: "Nuevo nombre" }),
    }
    mockedUpdateWorkflow.mockResolvedValue({ status: true, data: renameResponse })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.renameWorkflowAction("Nuevo nombre")
    })

    expect(ok).toBe(true)
    expect(mockedUpdateWorkflow).toHaveBeenCalledWith("w1", { name: "Nuevo nombre" })
    expect(result.current.store.workflowName).toBe("Nuevo nombre")
  })

  it("no renombra si el nombre está vacío", async () => {
    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.renameWorkflowAction("   ")
    })

    expect(ok).toBe(false)
    expect(mockedUpdateWorkflow).not.toHaveBeenCalled()
  })

  it("carga el grafo y deriva edges desde nextNode", async () => {
    mockedGet.mockResolvedValue({ status: true, data: graphResponse() })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    await act(async () => {
      await result.current.actions.loadGraphAction()
    })

    expect(result.current.store.nodes).toHaveLength(2)
    expect(result.current.store.nodes[0]?.type).toBe("node:trigger")
    expect((result.current.store.nodes[0]?.data as { node: { nextNode: string } }).node.nextNode).toBe("n2")
    expect(result.current.store.edges).toHaveLength(1)
    expect(result.current.store.edges[0]?.sourceHandle).toBe("main")
    expect(result.current.store.loading).toBe(false)
    expect(result.current.store.dirty).toBe(false)
  })

  it("deriva edges de botones WhatsApp desde configuration", async () => {
    mockedGet.mockResolvedValue({
      status: true,
      data: {
        graph: {
          workflowId: "w1",
          nodes: [
            {
              id: "n1",
              title: "WhatsApp",
              createdAt: "2026-01-01T00:00:00.000Z",
              type: "node:whatsapp",
              configuration: {
                action: "sendMessage",
                properties: [
                  { type: "message", value: "hola" },
                  {
                    type: "buttons",
                    value: [
                      { id: "btn_1", text: "Sí", nextNode: "n2" },
                      { id: "btn_2", text: "No", nextNode: "" },
                    ],
                  },
                ],
              },
              nextNode: "",
              position: { x: 0, y: 0 },
            },
            {
              id: "n2",
              title: "Agente",
              createdAt: "2026-01-01T00:00:00.000Z",
              type: "node:agent",
              configuration: { prompt: "" },
              nextNode: "",
              position: { x: 200, y: 0 },
            },
          ],
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    await act(async () => {
      await result.current.actions.loadGraphAction()
    })

    expect(result.current.store.edges).toHaveLength(1)
    expect(result.current.store.edges[0]?.sourceHandle).toBe("btn_1")
    expect(result.current.store.edges[0]?.target).toBe("n2")
  })

  it("no pisa el estado si la API responde status false", async () => {
    mockedGet.mockResolvedValue({
      status: false,
      data: null as unknown as GetWorkflowGraphResponseDTO,
      message: "Workflow no encontrado",
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    await act(async () => {
      await result.current.actions.loadGraphAction()
    })

    expect(result.current.store.nodes).toHaveLength(0)
    expect(result.current.store.loading).toBe(false)
  })

  it("es resiliente si la respuesta viene sin graph", async () => {
    mockedGet.mockResolvedValue({ status: true, data: {} as GetWorkflowGraphResponseDTO })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    await act(async () => {
      await result.current.actions.loadGraphAction()
    })

    expect(result.current.store.nodes).toHaveLength(0)
    expect(result.current.store.loading).toBe(false)
  })

  it("guarda sólo nodes sin edges", async () => {
    const saveResponse: SaveWorkflowGraphResponseDTO = {
      graph: {
        workflowId: "w1",
        nodes: [
          {
            id: "n1",
            title: "Trigger",
            createdAt: "2026-01-01T00:00:00.000Z",
            type: "node:trigger",
            configuration: {},
            nextNode: "",
            position: { x: 0, y: 0 },
          },
        ],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    }
    mockedSave.mockResolvedValue({ status: true, data: saveResponse })

    const { result } = renderHook(useHarness, { wrapper })

    const rfNode: Node = {
      id: "n1",
      type: "node:trigger",
      position: { x: 10, y: 20 },
      data: {
        node: {
          id: "n1",
          title: "Trigger",
          createdAt: "2026-01-01T00:00:00.000Z",
          type: "node:trigger",
          configuration: {},
          nextNode: "",
        },
      },
    }

    act(() => {
      result.current.store.setWorkflowId("w1")
      result.current.store.setNodes([rfNode])
      result.current.store.setEdges([{ id: "e1", source: "n1", target: "n2" }])
      result.current.store.markDirty()
    })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.saveGraphAction()
    })

    expect(ok).toBe(true)
    expect(mockedSave).toHaveBeenCalledWith("w1", {
      nodes: [
        {
          id: "n1",
          title: "Trigger",
          createdAt: "2026-01-01T00:00:00.000Z",
          type: "node:trigger",
          configuration: {},
          nextNode: "",
          position: { x: 10, y: 20 },
        },
      ],
    })
    expect(result.current.store.dirty).toBe(false)
  })

  it("no marca saved si el guardado falla", async () => {
    mockedSave.mockResolvedValue({
      status: false,
      data: null as unknown as SaveWorkflowGraphResponseDTO,
      message: "No autorizado",
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
      result.current.store.markDirty()
    })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.saveGraphAction()
    })

    expect(ok).toBe(false)
    expect(result.current.store.dirty).toBe(true)
  })

  it("addNode incrementa los nodes y marca dirty", () => {
    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.addNode({
        id: "n1",
        type: "node:trigger",
        position: { x: 0, y: 0 },
        data: {
          node: {
            id: "n1",
            title: "Trigger",
            createdAt: "2026-01-01T00:00:00.000Z",
            type: "node:trigger",
            configuration: {},
            nextNode: "",
          },
        },
      })
    })

    expect(result.current.store.nodes).toHaveLength(1)
    expect(result.current.store.dirty).toBe(true)
  })

  it("removeEdge quita la relación y marca dirty", () => {
    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setEdges([{ id: "e1", source: "a", target: "b" }])
      result.current.store.removeEdge("e1")
    })

    expect(result.current.store.edges).toHaveLength(0)
    expect(result.current.store.dirty).toBe(true)
  })
  it("hidrata y persiste tamaño de notas en configuration", async () => {
    mockedGet.mockResolvedValue({
      status: true,
      data: {
        graph: {
          workflowId: "w1",
          nodes: [
            {
              id: "n1",
              title: "Nota",
              createdAt: "2026-01-01T00:00:00.000Z",
              type: "node:note",
              configuration: { text: "hola", width: 300, height: 180 },
              nextNode: "",
              position: { x: 10, y: 20 },
            },
          ],
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    await act(async () => {
      await result.current.actions.loadGraphAction()
    })

    const loaded = result.current.store.nodes[0]
    expect(loaded?.width).toBe(300)
    expect(loaded?.height).toBe(180)
    expect(loaded?.zIndex).toBe(-1)
    expect(loaded?.connectable).toBe(false)

    mockedSave.mockResolvedValue({
      status: true,
      data: {
        graph: {
          workflowId: "w1",
          nodes: [
            {
              id: "n1",
              title: "Nota",
              createdAt: "2026-01-01T00:00:00.000Z",
              type: "node:note",
              configuration: { text: "hola", width: 300, height: 180 },
              nextNode: "",
              position: { x: 10, y: 20 },
            },
          ],
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    })

    act(() => {
      result.current.store.setNodes([
        {
          ...(loaded as Node),
          width: 420,
          height: 260,
        },
      ])
      result.current.store.markDirty()
    })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.saveGraphAction()
    })

    expect(ok).toBe(true)
    const saved = mockedSave.mock.calls[0]?.[1]
    expect(saved?.nodes[0]?.configuration).toEqual({
      text: "hola",
      width: 420,
      height: 260,
      color: "amber",
    })
    expect(saved?.nodes[0]?.type).toBe("node:note")
  })

  it("no genera edges para notas", async () => {
    mockedGet.mockResolvedValue({
      status: true,
      data: {
        graph: {
          workflowId: "w1",
          nodes: [
            {
              id: "n1",
              title: "Nota",
              createdAt: "2026-01-01T00:00:00.000Z",
              type: "node:note",
              configuration: { text: "", width: 220, height: 140 },
              nextNode: "n2",
              position: { x: 0, y: 0 },
            },
            {
              id: "n2",
              title: "Agente",
              createdAt: "2026-01-01T00:00:00.000Z",
              type: "node:agent",
              configuration: { prompt: "" },
              nextNode: "",
              position: { x: 200, y: 0 },
            },
          ],
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    await act(async () => {
      await result.current.actions.loadGraphAction()
    })

    expect(result.current.store.edges).toHaveLength(0)
  })

  it("no llama saveGraphAction si no hay dirty", async () => {
    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.saveGraphAction()
    })

    expect(ok).toBe(false)
    expect(mockedSave).not.toHaveBeenCalled()
  })

  it("publica el workflow y actualiza el meta", async () => {
    mockedPublish.mockResolvedValue({
      status: true,
      data: {
        workflow: workflowDto({
          status: "published",
          version: 1,
          publishedAt: "2026-01-03T00:00:00.000Z",
          hasUnpublishedChanges: false,
        }),
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.publishWorkflowAction()
    })

    expect(ok).toBe(true)
    expect(mockedPublish).toHaveBeenCalledWith("w1")
    expect(mockedSave).not.toHaveBeenCalled()
    expect(result.current.store.status).toBe("published")
    expect(result.current.store.version).toBe(1)
    expect(result.current.store.hasUnpublishedChanges).toBe(false)
    expect(result.current.store.publishing).toBe(false)
  })

  it("publica flusheando el grafo dirty antes del publish", async () => {
    const rfNode: Node = {
      id: "n1",
      type: "node:trigger",
      position: { x: 10, y: 20 },
      data: {
        node: {
          id: "n1",
          title: "Trigger",
          createdAt: "2026-01-01T00:00:00.000Z",
          type: "node:trigger",
          configuration: {},
          nextNode: "",
        },
      },
    }

    mockedSave.mockResolvedValue({
      status: true,
      data: graphResponse(),
    })
    mockedPublish.mockResolvedValue({
      status: true,
      data: {
        workflow: workflowDto({
          status: "published",
          version: 2,
          publishedAt: "2026-01-03T00:00:00.000Z",
          hasUnpublishedChanges: false,
        }),
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
      result.current.store.setNodes([rfNode])
      result.current.store.markDirty()
    })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.publishWorkflowAction()
    })

    expect(ok).toBe(true)
    expect(mockedSave).toHaveBeenCalledTimes(1)
    expect(mockedPublish).toHaveBeenCalledWith("w1")
    expect(result.current.store.version).toBe(2)
  })

  it("no publica si el flush del grafo falla", async () => {
    mockedSave.mockResolvedValue({
      status: false,
      data: null as unknown as SaveWorkflowGraphResponseDTO,
      message: "No autorizado",
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
      result.current.store.markDirty()
    })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.publishWorkflowAction()
    })

    expect(ok).toBe(false)
    expect(mockedPublish).not.toHaveBeenCalled()
  })

  it("lista las versiones del workflow", async () => {
    mockedListVersions.mockResolvedValue({
      status: true,
      data: {
        items: [
          {
            workflowId: "w1",
            version: 2,
            name: "Mi flow",
            nodeCount: 5,
            publishedAt: "2026-01-03T00:00:00.000Z",
          },
        ],
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
    })

    let items: WorkflowVersionSummaryDTO[] = []
    await act(async () => {
      items = (await result.current.actions.listVersionsAction()) ?? []
    })

    expect(items).toHaveLength(1)
    expect(items[0]?.version).toBe(2)
  })

  it("restaura una versión y aplica el grafo + meta", async () => {
    mockedRestore.mockResolvedValue({
      status: true,
      data: {
        graph: graphResponse().graph,
        workflow: workflowDto({
          status: "published",
          version: 2,
          publishedAt: "2026-01-02T00:00:00.000Z",
          hasUnpublishedChanges: true,
        }),
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
      result.current.store.setWorkflowMeta({
        status: "published",
        version: 2,
        publishedAt: "2026-01-02T00:00:00.000Z",
        hasUnpublishedChanges: false,
      })
    })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.restoreVersionAction(2)
    })

    expect(ok).toBe(true)
    expect(mockedRestore).toHaveBeenCalledWith("w1", 2)
    expect(result.current.store.nodes).toHaveLength(2)
    expect(result.current.store.hasUnpublishedChanges).toBe(true)
    expect(result.current.store.loading).toBe(false)
  })

  it("revierte cambios a la última versión publicada", async () => {
    mockedRevert.mockResolvedValue({
      status: true,
      data: {
        graph: graphResponse().graph,
        workflow: workflowDto({
          status: "published",
          version: 3,
          publishedAt: "2026-01-04T00:00:00.000Z",
          hasUnpublishedChanges: false,
        }),
      },
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
      result.current.store.setWorkflowMeta({
        status: "published",
        version: 3,
        publishedAt: "2026-01-04T00:00:00.000Z",
        hasUnpublishedChanges: true,
      })
      result.current.store.markDirty()
    })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.revertChangesAction()
    })

    expect(ok).toBe(true)
    expect(mockedRevert).toHaveBeenCalledWith("w1")
    expect(result.current.store.hasUnpublishedChanges).toBe(false)
    expect(result.current.store.dirty).toBe(false)
    expect(result.current.store.nodes).toHaveLength(2)
  })

  it("no revierte si la API falla", async () => {
    mockedRevert.mockResolvedValue({
      status: false,
      data: null as unknown as never,
      message: "No hay versiones publicadas",
    })

    const { result } = renderHook(useHarness, { wrapper })

    act(() => {
      result.current.store.setWorkflowId("w1")
      result.current.store.setWorkflowMeta({
        status: "published",
        version: 1,
        publishedAt: "2026-01-04T00:00:00.000Z",
        hasUnpublishedChanges: true,
      })
    })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.revertChangesAction()
    })

    expect(ok).toBe(false)
    expect(result.current.store.hasUnpublishedChanges).toBe(true)
  })
})

describe("nodesToEdges", () => {
  it("construye edge main y edge de botón", () => {
    const nodes: Node[] = [
      {
        id: "n1",
        type: "node:whatsapp",
        position: { x: 0, y: 0 },
        data: {
          node: {
            id: "n1",
            title: "WhatsApp",
            createdAt: "2026-01-01T00:00:00.000Z",
            type: "node:whatsapp",
            configuration: {
              action: "sendMessage",
              properties: [
                { type: "message", value: "hola" },
                {
                  type: "buttons",
                  value: [
                    { id: "btn_1", text: "Sí", nextNode: "n3" },
                    { id: "btn_2", text: "No", nextNode: "n2" },
                  ],
                },
              ],
            },
            nextNode: "n2",
          },
        },
      },
      {
        id: "n2",
        type: "node:agent",
        position: { x: 100, y: 0 },
        data: {
          node: {
            id: "n2",
            title: "Agente",
            createdAt: "2026-01-01T00:00:00.000Z",
            type: "node:agent",
            configuration: { prompt: "" },
            nextNode: "",
          },
        },
      },
      {
        id: "n3",
        type: "node:agent",
        position: { x: 200, y: 0 },
        data: {
          node: {
            id: "n3",
            title: "Agente 2",
            createdAt: "2026-01-01T00:00:00.000Z",
            type: "node:agent",
            configuration: { prompt: "" },
            nextNode: "",
          },
        },
      },
    ]

    const edges = nodesToEdges(nodes)
    expect(edges).toHaveLength(3)
    expect(edges.find((edge) => edge.sourceHandle === "main")?.target).toBe("n2")
    expect(edges.find((edge) => edge.sourceHandle === "btn_1")?.target).toBe("n3")
    expect(edges.find((edge) => edge.sourceHandle === "btn_2")?.target).toBe("n2")
  })
})
