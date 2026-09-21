import { describe, expect, it } from "vitest"

import { announcementBucket, formatCountdown, msUntilNextSecond } from "@/lib/mpkit/countdown"

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

describe("msUntilNextSecond", () => {
  it("waits a full second on an exact second boundary", () => {
    expect(msUntilNextSecond(90_000)).toBe(1000)
    expect(msUntilNextSecond(1000)).toBe(1000)
  })

  it("waits only until the display changes for partial seconds", () => {
    // 90.4 s shows 1:31 and flips to 1:30 once 0.4 s has passed.
    expect(msUntilNextSecond(90_400)).toBe(400)
    expect(msUntilNextSecond(1)).toBe(1)
    expect(msUntilNextSecond(999)).toBe(999)
  })

  it("is consistent with formatCountdown: the display changes exactly then", () => {
    for (const remaining of [90_400, 61_001, 12_345, 5_000, 1_500]) {
      const wait = msUntilNextSecond(remaining)
      expect(formatCountdown(remaining - wait)).not.toBe(formatCountdown(remaining))
      expect(formatCountdown(remaining - wait + 1)).toBe(formatCountdown(remaining))
    }
  })

  it("is 0 when the time is up or the input is invalid", () => {
    expect(msUntilNextSecond(0)).toBe(0)
    expect(msUntilNextSecond(-5)).toBe(0)
    expect(msUntilNextSecond(Number.NaN)).toBe(0)
  })
})

describe("announcementBucket", () => {
  it("uses 10, 30 and 60 second milestones near the end", () => {
    expect(announcementBucket(8_000)).toBe(10)
    expect(announcementBucket(10_000)).toBe(10)
    expect(announcementBucket(10_001)).toBe(30)
    expect(announcementBucket(30_000)).toBe(30)
    expect(announcementBucket(45_000)).toBe(60)
    expect(announcementBucket(60_000)).toBe(60)
  })

  it("uses whole minutes above a minute", () => {
    expect(announcementBucket(60_001)).toBe(120)
    expect(announcementBucket(125_000)).toBe(180)
    expect(announcementBucket(300_000)).toBe(300)
  })

  it("stays constant between milestones so a live region is not spammed", () => {
    const buckets = new Set<number>()
    for (let ms = 120_000; ms > 60_000; ms -= 1000) buckets.add(announcementBucket(ms))
    // 2:00 down to 1:01 is one milestone: within 2 minutes.
    expect(buckets.size).toBe(1)
  })

  it("is 0 when the time is up", () => {
    expect(announcementBucket(0)).toBe(0)
    expect(announcementBucket(-1)).toBe(0)
    expect(announcementBucket(Number.NaN)).toBe(0)
  })
})
