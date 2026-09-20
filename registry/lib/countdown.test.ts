import { describe, expect, it } from "vitest"

import { formatCountdown } from "@/registry/lib/countdown"

describe("formatCountdown", () => {
  it.each([
    [90_000, "1:30"],
    [61_000, "1:01"],
    [60_000, "1:00"],
    [59_000, "0:59"],
    [9_000, "0:09"],
    [600_000, "10:00"],
    [0, "0:00"],
  ])("formats %i ms as %s", (ms, expected) => {
    expect(formatCountdown(ms)).toBe(expected)
  })

  it("rounds partial seconds up so it never shows 0:00 early", () => {
    expect(formatCountdown(1)).toBe("0:01")
    expect(formatCountdown(1_001)).toBe("0:02")
  })

  it("clamps negative and invalid values to 0:00", () => {
    expect(formatCountdown(-5_000)).toBe("0:00")
    expect(formatCountdown(Number.NaN)).toBe("0:00")
  })
})
