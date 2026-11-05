import { describe, expect, it } from "vitest"

import { bookingCopy, bookingTotal, clampNights, listing } from "@/lib/booking"

describe("clampNights", () => {
  it("keeps a valid number of nights", () => {
    expect(clampNights(3)).toBe(3)
    expect(clampNights(listing.minNights)).toBe(listing.minNights)
    expect(clampNights(listing.maxNights)).toBe(listing.maxNights)
  })

  it("clamps to the listing's limits", () => {
    expect(clampNights(0)).toBe(listing.minNights)
    expect(clampNights(-4)).toBe(listing.minNights)
    expect(clampNights(99)).toBe(listing.maxNights)
  })

  it("rounds to a whole number of nights", () => {
    expect(clampNights(2.4)).toBe(2)
    expect(clampNights(2.6)).toBe(3)
  })

  it("falls back to the minimum for values that are not numbers", () => {
    expect(clampNights(Number.NaN)).toBe(listing.minNights)
    expect(clampNights(Number.POSITIVE_INFINITY)).toBe(listing.minNights)
  })
})

describe("bookingTotal", () => {
  it("multiplies the nights by the nightly price", () => {
    expect(bookingTotal(1)).toBe(25000)
    expect(bookingTotal(3)).toBe(75000)
    expect(bookingTotal(14)).toBe(350000)
  })

  it("never charges for a number of nights outside the limits", () => {
    expect(bookingTotal(0)).toBe(25000)
    expect(bookingTotal(40)).toBe(350000)
  })

  it("is always a whole number of francs", () => {
    for (let nights = 1; nights <= 14; nights++) {
      expect(Number.isInteger(bookingTotal(nights))).toBe(true)
    }
  })

  it("uses the price of the listing it is given", () => {
    expect(bookingTotal(2, { ...listing, pricePerNight: 10000 })).toBe(20000)
  })
})

describe("bookingCopy", () => {
  it("pluralises nights in both languages", () => {
    expect(bookingCopy.fr.nightsCount(1)).toBe("1 nuit")
    expect(bookingCopy.fr.nightsCount(3)).toBe("3 nuits")
    expect(bookingCopy.en.nightsCount(1)).toBe("1 night")
    expect(bookingCopy.en.nightsCount(3)).toBe("3 nights")
  })

  it("has the same keys in French and English", () => {
    expect(Object.keys(bookingCopy.fr).sort()).toEqual(Object.keys(bookingCopy.en).sort())
    expect(Object.keys(bookingCopy.fr.scenarios).sort()).toEqual(
      Object.keys(bookingCopy.en.scenarios).sort()
    )
  })

  it("names the listing in both languages", () => {
    expect(listing.name.fr.length).toBeGreaterThan(0)
    expect(listing.name.en.length).toBeGreaterThan(0)
  })
})
