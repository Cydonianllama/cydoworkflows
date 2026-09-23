import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider, useTheme } from "../ThemeProvider"
import { nextTheme, resolveTheme, THEME_STORAGE_KEY } from "../theme"

function createMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === "(prefers-color-scheme: dark)" ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

describe("theme helpers", () => {
  it("resuelve system según prefers-color-scheme", () => {
    vi.stubGlobal("matchMedia", createMatchMedia(true))
    expect(resolveTheme("system")).toBe("dark")

    vi.stubGlobal("matchMedia", createMatchMedia(false))
    expect(resolveTheme("system")).toBe("light")
  })

  it("resuelve light y dark directamente", () => {
    expect(resolveTheme("light")).toBe("light")
    expect(resolveTheme("dark")).toBe("dark")
  })

  it("cicla light → dark → system", () => {
    expect(nextTheme("light")).toBe("dark")
    expect(nextTheme("dark")).toBe("system")
    expect(nextTheme("system")).toBe("light")
  })
})

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark")
    vi.stubGlobal("matchMedia", createMatchMedia(false))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("lanza si se usa fuera del provider", () => {
    expect(() => renderHook(() => useTheme())).toThrow("useTheme debe usarse dentro de <ThemeProvider>")
  })

  it("aplica la clase .dark en <html> y la persiste", () => {
    const { result } = renderHook(useTheme, { wrapper })

    act(() => {
      result.current.setTheme("dark")
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    expect(result.current.resolvedTheme).toBe("dark")
  })

  it("quita la clase .dark al volver a light", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")

    const { result } = renderHook(useTheme, { wrapper })
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => {
      result.current.setTheme("light")
    })

    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
  })

  it("lee la preferencia guardada al montar", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark")

    const { result } = renderHook(useTheme, { wrapper })

    expect(result.current.theme).toBe("dark")
    expect(result.current.resolvedTheme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("resuelve system contra prefers-color-scheme", () => {
    vi.stubGlobal("matchMedia", createMatchMedia(true))

    const { result } = renderHook(useTheme, { wrapper })

    act(() => {
      result.current.setTheme("system")
    })

    expect(result.current.resolvedTheme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("system")
  })
})
