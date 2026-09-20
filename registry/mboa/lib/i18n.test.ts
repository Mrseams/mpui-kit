import { describe, expect, it } from "vitest"

import { createTranslator, interpolate, messages, translate } from "@/lib/mboa/i18n"

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort()

describe("dictionary", () => {
  it("has the same keys in French and English", () => {
    expect(Object.keys(messages.fr).sort()).toEqual(Object.keys(messages.en).sort())
  })

  it("has no empty strings", () => {
    for (const locale of ["fr", "en"] as const) {
      for (const [key, value] of Object.entries(messages[locale])) {
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0)
      }
    }
  })

  it("uses the same placeholders in both languages", () => {
    for (const key of Object.keys(messages.en) as (keyof typeof messages.en)[]) {
      expect(placeholders(messages.fr[key]), key).toEqual(placeholders(messages.en[key]))
    }
  })
})

describe("interpolate", () => {
  it("replaces named placeholders", () => {
    expect(interpolate("Pay {amount} now", { amount: "25 000 FCFA" })).toBe("Pay 25 000 FCFA now")
    expect(interpolate("{a}-{a}", { a: 1 })).toBe("1-1")
  })

  it("leaves unknown placeholders visible", () => {
    expect(interpolate("Hello {name}", {})).toBe("Hello {name}")
  })

  it("returns the template unchanged without params", () => {
    expect(interpolate("Hello {name}")).toBe("Hello {name}")
  })
})

describe("translate / createTranslator", () => {
  it("translates in both languages", () => {
    expect(translate("en", "ussd.retry")).toBe("Try again")
    expect(translate("fr", "ussd.retry")).toBe("Réessayer")
  })

  it("interpolates params", () => {
    expect(translate("fr", "ussd.expiresIn", { time: "1:30" })).toBe("Expire dans 1:30")
  })

  it("lets overrides win over the dictionary", () => {
    const t = createTranslator("en", { "checkout.pay": "Book now for {amount}" })
    expect(t("checkout.pay", { amount: "50 000 FCFA" })).toBe("Book now for 50 000 FCFA")
    expect(t("ussd.retry")).toBe("Try again")
  })
})
