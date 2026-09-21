import { describe, expect, it } from "vitest"

import { currencyLabel, formatFcfa, INVALID_AMOUNT } from "@/lib/mpkit/format-fcfa"

const NBSP = " "

describe("formatFcfa", () => {
  it("formats with French spacing and the FCFA label by default", () => {
    expect(formatFcfa(25000)).toBe(`25${NBSP}000${NBSP}FCFA`)
  })

  it("handles zero, small and large amounts", () => {
    expect(formatFcfa(0)).toBe(`0${NBSP}FCFA`)
    expect(formatFcfa(999)).toBe(`999${NBSP}FCFA`)
    expect(formatFcfa(1000)).toBe(`1${NBSP}000${NBSP}FCFA`)
    expect(formatFcfa(1_250_000)).toBe(`1${NBSP}250${NBSP}000${NBSP}FCFA`)
  })

  it("never emits a narrow no-break space or a regular space", () => {
    const result = formatFcfa(1_250_000)
    expect(result).not.toMatch(/[  ]/)
  })

  it("shows the ISO code for XAF and XOF when asked", () => {
    expect(formatFcfa(25000, { display: "code" })).toBe(`25${NBSP}000${NBSP}XAF`)
    expect(formatFcfa(25000, { display: "code", currency: "XOF" })).toBe(`25${NBSP}000${NBSP}XOF`)
  })

  it("can omit the currency label", () => {
    expect(formatFcfa(25000, { display: "none" })).toBe(`25${NBSP}000`)
  })

  it("uses English grouping for the en locale", () => {
    expect(formatFcfa(25000, { locale: "en" })).toBe(`25,000${NBSP}FCFA`)
  })

  it("rounds to zero decimals, half away from zero", () => {
    expect(formatFcfa(1234.4)).toBe(`1${NBSP}234${NBSP}FCFA`)
    expect(formatFcfa(1234.5)).toBe(`1${NBSP}235${NBSP}FCFA`)
  })

  it("formats negative amounts with an ASCII minus", () => {
    expect(formatFcfa(-25000)).toBe(`-25${NBSP}000${NBSP}FCFA`)
  })

  it("does not print negative zero", () => {
    expect(formatFcfa(-0.4)).toBe(`0${NBSP}FCFA`)
    expect(formatFcfa(-0)).toBe(`0${NBSP}FCFA`)
  })

  it("returns a placeholder for non-finite input", () => {
    expect(formatFcfa(Number.NaN)).toBe(INVALID_AMOUNT)
    expect(formatFcfa(Number.POSITIVE_INFINITY)).toBe(INVALID_AMOUNT)
  })
})

describe("currencyLabel", () => {
  it("returns FCFA for the symbol and the ISO code otherwise", () => {
    expect(currencyLabel("XAF")).toBe("FCFA")
    expect(currencyLabel("XOF", "symbol")).toBe("FCFA")
    expect(currencyLabel("XOF", "code")).toBe("XOF")
  })
})
