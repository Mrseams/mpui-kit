// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  THEME_STORAGE_KEY,
  applyTheme,
  isDark,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  themeInitScript,
} from "@/lib/theme"

/** Runs the inline <head> script with a given stored value and system preference. */
function runInitScript(stored: string | null, systemDark: boolean | "throws") {
  document.documentElement.className = ""
  if (stored === null) localStorage.removeItem(THEME_STORAGE_KEY)
  else localStorage.setItem(THEME_STORAGE_KEY, stored)
  vi.stubGlobal("matchMedia", (query: string) => {
    if (systemDark === "throws") throw new Error("matchMedia unavailable")
    return { matches: query.includes("dark") && systemDark, media: query }
  })
  window.eval(themeInitScript)
  return document.documentElement.classList.contains("dark")
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("resolveTheme", () => {
  it("follows the system when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("dark")
    expect(resolveTheme(null, false)).toBe("light")
  })

  it("lets a stored choice win over the system", () => {
    expect(resolveTheme("light", true)).toBe("light")
    expect(resolveTheme("dark", false)).toBe("dark")
  })

  it("ignores a stored value it does not know", () => {
    expect(resolveTheme("purple", true)).toBe("dark")
    expect(resolveTheme("", false)).toBe("light")
  })
})

describe("themeInitScript", () => {
  const stored = [null, "light", "dark", "purple"] as const
  const systems = [true, false] as const

  it.each(stored.flatMap((value) => systems.map((system) => [value, system] as const)))(
    "agrees with resolveTheme for stored=%s and system dark=%s",
    (value, system) => {
      const expected = resolveTheme(value, system) === "dark"
      expect(runInitScript(value, system)).toBe(expected)
    }
  )

  it("does not throw and leaves light mode when the system query fails", () => {
    expect(() => runInitScript(null, "throws")).not.toThrow()
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("still uses the system preference when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    document.documentElement.className = ""
    vi.stubGlobal("matchMedia", () => ({ matches: true }))
    window.eval(themeInitScript)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("is small, because it blocks rendering", () => {
    expect(themeInitScript.length).toBeLessThan(400)
  })
})

describe("storage helpers", () => {
  it("stores and reads a theme", () => {
    expect(readStoredTheme()).toBeNull()
    storeTheme("dark")
    expect(readStoredTheme()).toBe("dark")
    storeTheme("light")
    expect(readStoredTheme()).toBe("light")
  })

  it("treats a bad stored value as none", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "nope")
    expect(readStoredTheme()).toBeNull()
  })

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    expect(readStoredTheme()).toBeNull()
    expect(() => storeTheme("dark")).not.toThrow()
  })
})

describe("applyTheme", () => {
  it("adds and removes the dark class", () => {
    applyTheme("dark")
    expect(isDark()).toBe(true)
    applyTheme("light")
    expect(isDark()).toBe(false)
  })
})
