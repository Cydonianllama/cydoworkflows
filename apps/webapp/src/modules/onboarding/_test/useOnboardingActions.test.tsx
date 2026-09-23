import type { AuthClientPort, AuthSessionUser } from "@cydo/auth"
import { AuthProvider } from "@cydo/auth/client"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { useOnboardingActions } from "../actions/useOnboardingActions"
import { OnboardingStoreProvider, useOnboardingStore } from "../store"

const sessionUser: AuthSessionUser = {
  id: "u1",
  email: "ada@cydo.app",
  emailVerified: true,
  provider: "local",
  profile: { name: "Ada", jobRole: "founder", expectedUsers: 10 },
  roleInAccount: "owner",
  status: "active",
  onboardingCompleted: true,
}

function createClient(): AuthClientPort {
  return {
    register: vi.fn(async () => null),
    verifyOtp: vi.fn(async () => null),
    resendOtp: vi.fn(async () => null),
    login: vi.fn(async () => null),
    loginWithGoogle: vi.fn(async () => null),
    refresh: vi.fn(async () => null),
    logout: vi.fn(async () => undefined),
    me: vi.fn(async () => null),
    completeOnboarding: vi.fn(async () => ({ status: true, data: { user: sessionUser, invited: ["team@cydo.app"] } })),
  }
}

function makeWrapper(client: AuthClientPort) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <AuthProvider client={client} bootstrap={false}>
          <OnboardingStoreProvider>{children}</OnboardingStoreProvider>
        </AuthProvider>
      </MemoryRouter>
    )
  }
}

function useHarness() {
  return { actions: useOnboardingActions(), store: useOnboardingStore() }
}

describe("useOnboardingActions", () => {
  it("envía rol, cantidad de usuarios e invitaciones válidas", async () => {
    const client = createClient()
    const { result } = renderHook(useHarness, { wrapper: makeWrapper(client) })

    act(() => {
      result.current.store.setJobRole("founder")
      result.current.store.setExpectedUsers("10")
      result.current.store.addInvite()
      result.current.store.updateInviteEmail(0, "team@cydo.app")
    })

    let ok = false
    await act(async () => {
      ok = await result.current.actions.completeOnboardingAction()
    })

    expect(ok).toBe(true)
    expect(client.completeOnboarding).toHaveBeenCalledWith({
      jobRole: "founder",
      expectedUsers: 10,
      invites: [{ email: "team@cydo.app", role: "member" }],
    })
    expect(result.current.store.loading).toBe(false)
  })

  it("ignora invitaciones sin email", async () => {
    const client = createClient()
    const { result } = renderHook(useHarness, { wrapper: makeWrapper(client) })

    act(() => {
      result.current.store.setJobRole("product")
      result.current.store.setExpectedUsers("3")
      result.current.store.addInvite()
      result.current.store.addInvite()
      result.current.store.updateInviteEmail(1, "  ")
    })

    await act(async () => {
      await result.current.actions.completeOnboardingAction()
    })

    expect(client.completeOnboarding).toHaveBeenCalledWith({
      jobRole: "product",
      expectedUsers: 3,
      invites: [],
    })
  })

  it("es resiliente si el onboarding falla", async () => {
    const client = createClient()
    vi.mocked(client.completeOnboarding).mockResolvedValueOnce(null)
    const { result } = renderHook(useHarness, { wrapper: makeWrapper(client) })

    act(() => {
      result.current.store.setJobRole("founder")
      result.current.store.setExpectedUsers("5")
    })

    let ok = true
    await act(async () => {
      ok = await result.current.actions.completeOnboardingAction()
    })

    expect(ok).toBe(false)
    expect(result.current.store.loading).toBe(false)
  })
})
