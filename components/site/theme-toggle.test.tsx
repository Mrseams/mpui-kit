// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeToggle } from "@/components/site/theme-toggle"
import { THEME_STORAGE_KEY } from "@/lib/theme"

type Listener = (event: { matches: boolean }) => void

/** A controllable stand-in for the OS dark mode setting. */
function stubSystemTheme(initialDark: boolean) {
  const listeners = new Set<Listener>()
  let matches = initialDark
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return matches
    },
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
  }))
  return {
    listenerCount: () => listeners.size,
    /** Async because the toggle hears about class changes through a MutationObserver. */
    async change(next: boolean) {
      matches = next
      await act(async () => {
        listeners.forEach((listener) => listener({ matches: next }))
      })
    },
  }
}

const isDark = () => document.documentElement.classList.contains("dark")
const button = () => screen.getByRole("button", { name: "Dark mode" })

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("<ThemeToggle />", () => {
  it("is a toggle button that says whether dark mode is on", () => {
    stubSystemTheme(false)
    render(<ThemeToggle />)
    expect(button()).toHaveAttribute("aria-pressed", "false")
  })

  it("reflects a page that is already dark", () => {
    stubSystemTheme(true)
    document.documentElement.classList.add("dark")
    render(<ThemeToggle />)
    expect(button()).toHaveAttribute("aria-pressed", "true")
  })

  it("switches to dark, remembers it, and switches back", async () => {
    stubSystemTheme(false)
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(button())
    expect(isDark()).toBe(true)
    expect(button()).toHaveAttribute("aria-pressed", "true")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")

    await user.click(button())
    expect(isDark()).toBe(false)
    expect(button()).toHaveAttribute("aria-pressed", "false")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
  })

  it("can be used from the keyboard", async () => {
    stubSystemTheme(false)
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await user.tab()
    expect(button()).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(isDark()).toBe(true)
  })

  it("follows the operating system while the visitor has not chosen", async () => {
    const system = stubSystemTheme(false)
    render(<ThemeToggle />)

    await system.change(true)
    expect(isDark()).toBe(true)
    expect(button()).toHaveAttribute("aria-pressed", "true")

    await system.change(false)
    expect(isDark()).toBe(false)
  })

  it("stops following the operating system once the visitor has chosen", async () => {
    const system = stubSystemTheme(false)
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(button()) // chooses dark
    await system.change(false)
    expect(isDark()).toBe(true)
  })

  it("still works when storage is blocked", async () => {
    stubSystemTheme(false)
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await user.click(button())
    expect(isDark()).toBe(true)
  })

  it("removes its system listener when unmounted", () => {
    const system = stubSystemTheme(false)
    const { unmount } = render(<ThemeToggle />)
    expect(system.listenerCount()).toBe(1)
    unmount()
    expect(system.listenerCount()).toBe(0)
  })

  it("hides its icons from screen readers and puts both in the markup", () => {
    stubSystemTheme(false)
    const { container } = render(<ThemeToggle />)
    const icons = container.querySelectorAll("svg")
    expect(icons).toHaveLength(2)
    for (const icon of icons) expect(icon).toHaveAttribute("aria-hidden", "true")
  })
})
