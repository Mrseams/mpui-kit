import { describe, expect, it } from "vitest"

import { demoThemes, themeTokens } from "@/lib/demo-themes"

describe("demoThemes", () => {
  it("has unique ids and includes a default and a dark theme", () => {
    const ids = demoThemes.map((theme) => theme.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain("default")
    expect(ids).toContain("dark")
  })

  it("only sets CSS variables, so a theme cannot break the layout", () => {
    for (const theme of demoThemes) {
      for (const name of Object.keys(theme.variables)) {
        expect(name, `${theme.id}: ${name}`).toMatch(/^--[a-z-]+$/)
      }
    }
  })

  it("only sets tokens that the docs say the components read", () => {
    const documented = themeTokens.flatMap((row) => row.token.match(/--[a-z-]+/g) ?? [])
    for (const theme of demoThemes) {
      for (const name of Object.keys(theme.variables)) {
        expect(documented, `${theme.id} sets ${name}`).toContain(name)
      }
    }
  })

  it("makes every custom theme visibly different from the default", () => {
    for (const theme of demoThemes.filter((item) => item.id !== "default")) {
      expect(theme.className !== "" || Object.keys(theme.variables).length > 0).toBe(true)
    }
  })

  it("describes every theme", () => {
    for (const theme of demoThemes) {
      expect(theme.label.length).toBeGreaterThan(0)
      expect(theme.description.length).toBeGreaterThan(0)
    }
  })
})

describe("themeTokens", () => {
  it("documents --success as optional", () => {
    const success = themeTokens.find((row) => row.token.includes("--success"))
    expect(success?.token).toContain("optional")
    expect(success?.usedFor).toContain("--primary")
  })
})
