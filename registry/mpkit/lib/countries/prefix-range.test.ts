import { describe, expect, it } from "vitest"

import { prefixRange } from "@/lib/mpkit/countries/prefix-range"

describe("prefixRange", () => {
  it("expands an inclusive range", () => {
    expect(prefixRange("650", "653")).toEqual(["650", "651", "652", "653"])
    expect(prefixRange("6540", "6545")).toHaveLength(6)
  })

  it("returns a single prefix when the bounds are equal", () => {
    expect(prefixRange("6220", "6220")).toEqual(["6220"])
  })

  it("keeps leading zeros", () => {
    expect(prefixRange("006", "009")).toEqual(["006", "007", "008", "009"])
  })

  it("rejects non-digit input", () => {
    expect(() => prefixRange("65a", "659")).toThrow(RangeError)
  })

  it("rejects bounds of different lengths", () => {
    expect(() => prefixRange("65", "659")).toThrow(RangeError)
  })

  it("rejects a start greater than the end", () => {
    expect(() => prefixRange("659", "655")).toThrow(RangeError)
  })
})
