import { describe, expect, it } from "vitest"

import { formatDateTime } from "@/lib/mpkit/format-date"

const NOON = Date.UTC(2026, 0, 1, 12, 0)

describe("formatDateTime", () => {
  it("formats in French", () => {
    const text = formatDateTime(NOON, "fr", "UTC")
    expect(text).toContain("2026")
    expect(text).toContain("12:00")
    expect(text.toLowerCase()).toContain("janv")
  })

  it("formats in English", () => {
    const text = formatDateTime(NOON, "en", "UTC")
    expect(text).toContain("2026")
    expect(text).toContain("12:00")
    expect(text).toContain("Jan")
  })

  it("respects the time zone", () => {
    // Cameroon is UTC+1 all year.
    expect(formatDateTime(NOON, "en", "Africa/Douala")).toContain("13:00")
  })
})
