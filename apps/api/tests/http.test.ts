import type { AuthUser } from "@cydo/auth"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const h = vi.hoisted(() => {
  const owner = {
    id: "u1",
    email: "owner@cydo.app",
    emailVerified: true,
    provider: "local",
    passwordHash: null,
    profile: { name: "Owner", jobRole: "founder", expectedUsers: 10 },
    accountOwnerId: null,
    roleInAccount: "owner",
    status: "active",
    onboardingCompleted: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  } as AuthUser

  return { owner, current: owner as AuthUser }
})

vi.mock("../src/setup/container", () => ({
  authPorts: {
    tokens: {
      verifyAccess: (token: string) => (token === "valid-access-token" ? { sub: "u1" } : null),
      signAccess: () => "access-token",
      accessTtlMs: 900_000,
      refreshTtlMs: 604_800_000,
    },
    users: {
      findById: async () => h.current,
      findByEmail: async () => null,
      listMembers: async () => [],
    },
    crypto: {
      sha256: (value: string) => `sha:${value}`,
      randomToken: () => "random-token",
      randomOtp: () => "000000",
    },
    clock: { now: () => new Date() },
    email: { sendOtp: async () => undefined, sendInvite: async () => undefined },
    hasher: { hash: async () => "hashed", compare: async () => true },
    oauth: { verifyGoogleIdToken: async () => null },
    refreshTokens: { findByHash: async () => null, revoke: async () => undefined },
  },
  authService: {
    register: vi.fn(),
    verifyOtp: vi.fn(),
    resendOtp: vi.fn(),
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(async () => undefined),
    me: vi.fn(),
    completeOnboarding: vi.fn(),
    createSession: vi.fn(),
  },
  emailPort: {},
  userRepository: {},
}))

vi.mock("../src/modules/workflows/workflows.service", () => ({
  workflowsService: {
    create: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
    publish: vi.fn(),
    listVersions: vi.fn(),
    getVersion: vi.fn(),
    restoreVersion: vi.fn(),
    revertChanges: vi.fn(),
  },
}))

import { createApp } from "../src/setup/app"
import { workflowsService } from "../src/modules/workflows/workflows.service"

const app = createApp()
const AUTH_COOKIE = "cydo_access=valid-access-token"
const WORKFLOW_ID = "64b7f8f9a1b2c3d4e5f6a7b8"

const workflow = {
  id: "w1",
  name: "Alta de clientes",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  status: "published" as const,
  version: 2,
  publishedAt: "2026-01-02T00:00:00.000Z",
  hasUnpublishedChanges: false,
}

const pagination = { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }

beforeEach(() => {
  vi.clearAllMocks()
  h.current = h.owner
})

describe("API /workflows", () => {
  it("rechaza la petición sin sesión", async () => {
    const res = await request(app).get("/api/v1/workflows")

    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ status: false, code: "INVALID_TOKEN" })
  })

  it("lista workflows paginados", async () => {
    vi.mocked(workflowsService.list).mockResolvedValue({ items: [workflow], pagination })

    const res = await request(app).get("/api/v1/workflows?page=1&limit=10").set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe(true)
    expect(res.body.data.items).toHaveLength(1)
    expect(res.body.pagination).toMatchObject({ page: 1, total: 1, hasNextPage: false })
  })

  it("valida el nombre al crear", async () => {
    const res = await request(app).post("/api/v1/workflows").set("Cookie", AUTH_COOKIE).send({ name: "  " })

    expect(res.status).toBe(422)
    expect(workflowsService.create).not.toHaveBeenCalled()
  })

  it("crea el workflow cuando el nombre es válido", async () => {
    vi.mocked(workflowsService.create).mockResolvedValue(workflow)

    const res = await request(app).post("/api/v1/workflows").set("Cookie", AUTH_COOKIE).send({ name: workflow.name })

    expect(res.status).toBe(201)
    expect(res.body.data.workflow.name).toBe(workflow.name)
  })

  it("elimina el workflow", async () => {
    vi.mocked(workflowsService.remove).mockResolvedValue({ id: "w1" })

    const res = await request(app).delete("/api/v1/workflows/64b7f8f9a1b2c3d4e5f6a7b8").set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe("w1")
  })

  it("rechaza un id inválido", async () => {
    const res = await request(app).delete("/api/v1/workflows/no-es-un-object-id").set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(422)
    expect(workflowsService.remove).not.toHaveBeenCalled()
  })
})

describe("API /workflows versionado", () => {
  it("publica el workflow y devuelve el meta actualizado", async () => {
    const published = { ...workflow, version: 3, hasUnpublishedChanges: false }
    vi.mocked(workflowsService.publish).mockResolvedValue(published)

    const res = await request(app)
      .post(`/api/v1/workflows/${WORKFLOW_ID}/publish`)
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe(true)
    expect(res.body.data.workflow.version).toBe(3)
    expect(workflowsService.publish).toHaveBeenCalled()
  })

  it("rechaza publish con id inválido", async () => {
    const res = await request(app)
      .post("/api/v1/workflows/no-es-un-object-id/publish")
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(422)
    expect(workflowsService.publish).not.toHaveBeenCalled()
  })

  it("lista las versiones del workflow", async () => {
    vi.mocked(workflowsService.listVersions).mockResolvedValue({
      items: [
        {
          workflowId: "w1",
          version: 2,
          name: workflow.name,
          nodeCount: 4,
          publishedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      pagination,
    })

    const res = await request(app)
      .get(`/api/v1/workflows/${WORKFLOW_ID}/versions`)
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.data.items).toHaveLength(1)
    expect(res.body.data.items[0].version).toBe(2)
  })

  it("obtiene el detalle de una versión", async () => {
    vi.mocked(workflowsService.getVersion).mockResolvedValue({
      workflowId: "w1",
      version: 1,
      name: workflow.name,
      nodeCount: 2,
      publishedAt: "2026-01-01T00:00:00.000Z",
      nodes: [],
    })

    const res = await request(app)
      .get(`/api/v1/workflows/${WORKFLOW_ID}/versions/1`)
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.data.version.version).toBe(1)
  })

  it("rechaza una versión inválida", async () => {
    const res = await request(app)
      .get(`/api/v1/workflows/${WORKFLOW_ID}/versions/0`)
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(422)
    expect(workflowsService.getVersion).not.toHaveBeenCalled()
  })

  it("restaura una versión", async () => {
    vi.mocked(workflowsService.restoreVersion).mockResolvedValue({
      graph: { workflowId: "w1", nodes: [], updatedAt: "2026-01-01T00:00:00.000Z" },
      workflow: { ...workflow, hasUnpublishedChanges: true },
    })

    const res = await request(app)
      .post(`/api/v1/workflows/${WORKFLOW_ID}/versions/2/restore`)
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.message).toBe("Versión restaurada")
    expect(workflowsService.restoreVersion).toHaveBeenCalledWith(expect.any(String), WORKFLOW_ID, 2)
  })

  it("revierte cambios a la última versión", async () => {
    vi.mocked(workflowsService.revertChanges).mockResolvedValue({
      graph: { workflowId: "w1", nodes: [], updatedAt: "2026-01-01T00:00:00.000Z" },
      workflow: { ...workflow, hasUnpublishedChanges: false },
    })

    const res = await request(app)
      .post(`/api/v1/workflows/${WORKFLOW_ID}/revert`)
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(200)
    expect(res.body.message).toBe("Cambios revertidos")
  })

  it("devuelve 422 cuando no hay versiones para revertir", async () => {
    const { AUTH_ERROR, AuthError } = await import("@cydo/auth")
    vi.mocked(workflowsService.revertChanges).mockRejectedValue(
      new AuthError(AUTH_ERROR.VALIDATION, "No hay versiones publicadas"),
    )

    const res = await request(app)
      .post(`/api/v1/workflows/${WORKFLOW_ID}/revert`)
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(422)
    expect(res.body.code).toBe("VALIDATION")
  })

  it("no permite publicar a un miembro restringido", async () => {
    h.current = { ...h.owner, status: "restricted" }

    const res = await request(app)
      .post(`/api/v1/workflows/${WORKFLOW_ID}/publish`)
      .set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(403)
    expect(res.body.code).toBe("ACCOUNT_RESTRICTED")
    expect(workflowsService.publish).not.toHaveBeenCalled()
  })
})

describe("API permisos", () => {
  it("no permite escribir a un miembro restringido", async () => {
    h.current = { ...h.owner, status: "restricted" }

    const res = await request(app).post("/api/v1/workflows").set("Cookie", AUTH_COOKIE).send({ name: "Nuevo" })

    expect(res.status).toBe(403)
    expect(res.body.code).toBe("ACCOUNT_RESTRICTED")
  })

  it("no permite gestionar miembros a un member", async () => {
    h.current = { ...h.owner, roleInAccount: "member" }

    const res = await request(app).get("/api/v1/members").set("Cookie", AUTH_COOKIE)

    expect(res.status).toBe(403)
    expect(res.body.code).toBe("FORBIDDEN")
  })

  it("responde 404 en rutas desconocidas", async () => {
    const res = await request(app).get("/api/v1/desconocido")

    expect(res.status).toBe(404)
    expect(res.body.code).toBe("NOT_FOUND")
  })
})
