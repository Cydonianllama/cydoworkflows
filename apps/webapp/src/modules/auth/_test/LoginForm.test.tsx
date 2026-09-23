import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

const h = vi.hoisted(() => ({ loginAction: vi.fn() }))

vi.mock("../actions/useAuthModuleActions", () => ({
  useAuthModuleActions: () => ({
    loginAction: h.loginAction,
    loginWithGoogleAction: vi.fn(),
    loading: false,
  }),
}))

import { LoginForm } from "../compositions/LoginForm"

beforeEach(() => {
  h.loginAction.mockReset()
  h.loginAction.mockResolvedValue(true)
})

describe("LoginForm", () => {
  it("envía a la acción exactamente lo que escribió el usuario", async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@cydo.app" } })
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Cydo12345" } })
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }))

    await waitFor(() =>
      expect(h.loginAction).toHaveBeenCalledWith({ email: "admin@cydo.app", password: "Cydo12345" }),
    )
  })
})
