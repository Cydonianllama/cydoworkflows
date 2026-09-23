import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  inviteMemberRequest,
  listMembersRequest,
  removeMemberRequest,
  restrictMemberRequest,
} from "@/lib/api/members"
import type { MemberDTO } from "@/lib/api/members"
import { useSettingsActions } from "../actions/useSettingsActions"
import { SettingsStoreProvider, useSettingsStore } from "../store"

vi.mock("@/lib/api/members", () => ({
  listMembersRequest: vi.fn(),
  inviteMemberRequest: vi.fn(),
  updateMemberRoleRequest: vi.fn(),
  restrictMemberRequest: vi.fn(),
  removeMemberRequest: vi.fn(),
  getAccountOverviewRequest: vi.fn(),
  getInviteRequest: vi.fn(),
  acceptInviteRequest: vi.fn(),
}))

const mockedList = vi.mocked(listMembersRequest)
const mockedInvite = vi.mocked(inviteMemberRequest)
const mockedRestrict = vi.mocked(restrictMemberRequest)
const mockedRemove = vi.mocked(removeMemberRequest)

const member = (id: string, overrides: Partial<MemberDTO> = {}): MemberDTO => ({
  id,
  email: `${id}@cydo.app`,
  name: `Miembro ${id}`,
  roleInAccount: "member",
  status: "active",
  isOwner: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
})

function wrapper({ children }: { children: ReactNode }) {
  return <SettingsStoreProvider>{children}</SettingsStoreProvider>
}

function useHarness() {
  return { actions: useSettingsActions(), store: useSettingsStore() }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useSettingsActions", () => {
  it("guarda miembros e invitaciones", async () => {
    mockedList.mockResolvedValue({
      status: true,
      data: { members: [member("owner", { isOwner: true, roleInAccount: "owner" })], invites: [] },
    })

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.fetchMembersAction()
    })

    expect(result.current.store.members).toHaveLength(1)
    expect(result.current.store.members[0]?.isOwner).toBe(true)
  })

  it("es resiliente si la API responde sin data.members", async () => {
    mockedList.mockResolvedValue({ status: true, data: {} as { members: MemberDTO[]; invites: [] } })

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.fetchMembersAction()
    })

    expect(result.current.store.members).toEqual([])
  })

  it("no agrega la invitación si status es false", async () => {
    mockedInvite.mockResolvedValue({
      status: false,
      data: { invite: { id: "i1", email: "x@y.com", roleInAccount: "member", status: "pending", expiresAt: "", createdAt: "" } },
      message: "Ya existe",
    })

    const { result } = renderHook(useHarness, { wrapper })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.inviteMemberAction("x@y.com", "member")
    })

    expect(ok).toBe(false)
    expect(result.current.store.invites).toHaveLength(0)
  })

  it("actualiza el estado del miembro al restringirlo", async () => {
    mockedList.mockResolvedValue({ status: true, data: { members: [member("m1")], invites: [] } })
    mockedRestrict.mockResolvedValue({ status: true, data: { member: member("m1", { status: "restricted" }) } })

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.fetchMembersAction()
    })

    await act(async () => {
      await result.current.actions.restrictMemberAction("m1", true)
    })

    expect(result.current.store.members[0]?.status).toBe("restricted")
  })

  it("quita el miembro de la lista al eliminarlo", async () => {
    mockedList.mockResolvedValue({ status: true, data: { members: [member("m1"), member("m2")], invites: [] } })
    mockedRemove.mockResolvedValue({ status: true, data: { id: "m1" } })

    const { result } = renderHook(useHarness, { wrapper })

    await act(async () => {
      await result.current.actions.fetchMembersAction()
    })

    await act(async () => {
      await result.current.actions.removeMemberAction("m1")
    })

    expect(result.current.store.members.map((item) => item.id)).toEqual(["m2"])
  })
})
