import { describe, expect, it } from "vitest"

import { cm } from "@/lib/mboa/countries/cm"
import { createTranslator } from "@/lib/mboa/i18n"
import type { PhoneIssue } from "@/lib/mboa/phone"
import { phoneErrorMessage } from "@/lib/mboa/phone-errors"

const context = (locale: "fr" | "en", operator?: string) => ({
  country: cm,
  locale,
  t: createTranslator(locale),
  operator,
})

describe("phoneErrorMessage", () => {
  it("has a message for every issue in both languages", () => {
    const issues: PhoneIssue[] = [
      "empty",
      "invalid_chars",
      "wrong_country",
      "too_short",
      "too_long",
      "unknown_operator",
      "operator_mismatch",
    ]
    for (const locale of ["fr", "en"] as const) {
      for (const issue of issues) {
        const message = phoneErrorMessage(issue, context(locale, "mtn"))
        expect(message.length, `${locale}:${issue}`).toBeGreaterThan(0)
        expect(message, `${locale}:${issue}`).not.toMatch(/\{\w+\}/)
      }
    }
  })

  it("mentions the expected length", () => {
    expect(phoneErrorMessage("too_short", context("en"))).toContain("9")
    expect(phoneErrorMessage("too_long", context("fr"))).toContain("9")
  })

  it("names the country in the language of the UI", () => {
    expect(phoneErrorMessage("wrong_country", context("fr"))).toContain("Cameroun")
    expect(phoneErrorMessage("wrong_country", context("en"))).toContain("Cameroon")
  })

  it("names the required operator on a mismatch", () => {
    expect(phoneErrorMessage("operator_mismatch", context("en", "mtn"))).toBe(
      "This number does not belong to MTN."
    )
    expect(phoneErrorMessage("operator_mismatch", context("fr", "orange"))).toBe(
      "Ce numéro n'appartient pas à Orange."
    )
  })
})
