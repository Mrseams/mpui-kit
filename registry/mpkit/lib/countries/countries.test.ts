import { describe, expect, it } from "vitest"

import { countries } from "@/lib/mpkit/countries"

// Runs against every country in the index, so a contributor's new country is
// checked automatically as soon as it is added to `countries/index.ts`.
describe.each(Object.entries(countries))("country config: %s", (code, country) => {
  it("uses the file key as the lowercase ISO code", () => {
    expect(country.iso).toMatch(/^[A-Z]{2}$/)
    expect(country.iso.toLowerCase()).toBe(code)
  })

  it("has a digits-only calling code and a sensible number length", () => {
    expect(country.callingCode).toMatch(/^\d{1,3}$/)
    expect(country.nationalNumberLength).toBeGreaterThanOrEqual(6)
    expect(country.nationalNumberLength).toBeLessThanOrEqual(12)
    if (country.trunkPrefix !== undefined) {
      expect(country.trunkPrefix).toMatch(/^\d+$/)
    }
  })

  it("has group sizes that add up to the national number length", () => {
    const total = country.groupSizes.reduce((sum, size) => sum + size, 0)
    expect(total).toBe(country.nationalNumberLength)
  })

  it("has a default locale that is one of its locales", () => {
    expect(country.locales.length).toBeGreaterThan(0)
    expect(country.locales).toContain(country.defaultLocale)
  })

  it("has operators with unique ids, valid colors and digit prefixes", () => {
    const ids = country.operators.map((operator) => operator.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const operator of country.operators) {
      expect(operator.name.length).toBeGreaterThan(0)
      expect(operator.color).toMatch(/^(#[0-9a-fA-F]{3,8}|[a-z]+)$/)
      expect(operator.prefixes.length).toBeGreaterThan(0)
      for (const prefix of operator.prefixes) {
        expect(prefix).toMatch(/^\d+$/)
        expect(prefix.length).toBeLessThanOrEqual(country.nationalNumberLength)
      }
    }
  })

  it("has no prefix that is shadowed by another operator's prefix", () => {
    const entries = country.operators.flatMap((operator) =>
      operator.prefixes.map((prefix) => ({ operatorId: operator.id, prefix }))
    )
    for (const a of entries) {
      for (const b of entries) {
        if (a.operatorId === b.operatorId) continue
        expect(
          a.prefix.startsWith(b.prefix),
          `${a.operatorId}:${a.prefix} overlaps ${b.operatorId}:${b.prefix}`
        ).toBe(false)
      }
    }
  })

  it("has regions with unique ids and at least one city each", () => {
    expect(country.regions.length).toBeGreaterThan(0)
    const ids = country.regions.map((region) => region.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const region of country.regions) {
      expect(region.name.fr.length).toBeGreaterThan(0)
      expect(region.name.en.length).toBeGreaterThan(0)
      expect(region.cities.length).toBeGreaterThan(0)
    }
  })
})
