import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createCountdown } from "@/lib/mpkit/core/countdown-controller"

// Runs in Node: the countdown needs no DOM.

const START = new Date("2026-01-01T12:00:00Z").getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
})

const remaining = (countdown: ReturnType<typeof createCountdown>) =>
  countdown.getSnapshot().remainingMs

describe("createCountdown", () => {
  it("has no document, and still works", () => {
    expect(typeof document).toBe("undefined")
    const countdown = createCountdown({ expiresAt: START + 5_000 })
    expect(remaining(countdown)).toBe(5_000)
    countdown.destroy()
  })

  it("counts down once per second", () => {
    const countdown = createCountdown({ expiresAt: START + 5_000 })
    vi.advanceTimersByTime(1_000)
    expect(remaining(countdown)).toBe(4_000)
    vi.advanceTimersByTime(2_000)
    expect(remaining(countdown)).toBe(2_000)
    countdown.destroy()
  })

  it("ticks exactly when the displayed second changes", () => {
    // 90.4 s left shows 1:31 and should flip after 0.4 s, not after a whole second.
    const countdown = createCountdown({ expiresAt: START + 90_400 })
    const listener = vi.fn()
    countdown.subscribe(listener)

    vi.advanceTimersByTime(399)
    expect(listener).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(remaining(countdown)).toBe(90_000)
    countdown.destroy()
  })

  it("stops at zero and calls onExpire exactly once", () => {
    const onExpire = vi.fn()
    const countdown = createCountdown({ expiresAt: START + 3_000, onExpire })

    vi.advanceTimersByTime(3_000)
    expect(remaining(countdown)).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60_000)
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("expires at once when the deadline has already passed", () => {
    const onExpire = vi.fn()
    const countdown = createCountdown({ expiresAt: START - 1_000, onExpire })
    expect(remaining(countdown)).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
    countdown.destroy()
  })

  it("does nothing without a deadline", () => {
    const onExpire = vi.fn()
    const countdown = createCountdown({ expiresAt: null, onExpire })
    vi.advanceTimersByTime(60_000)
    expect(remaining(countdown)).toBe(0)
    expect(onExpire).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("does not notify on ticks where nothing visible changed", () => {
    const countdown = createCountdown({ expiresAt: START + 3_000 })
    const listener = vi.fn()
    countdown.subscribe(listener)
    vi.advanceTimersByTime(3_000)
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it("returns the same snapshot until the time changes", () => {
    const countdown = createCountdown({ expiresAt: START + 5_000 })
    expect(countdown.getSnapshot()).toBe(countdown.getSnapshot())
    const before = countdown.getSnapshot()
    vi.advanceTimersByTime(1_000)
    expect(countdown.getSnapshot()).not.toBe(before)
    countdown.destroy()
  })

  it("restarts for a new deadline, and can expire again", () => {
    const onExpire = vi.fn()
    const countdown = createCountdown({ expiresAt: START + 2_000, onExpire })
    vi.advanceTimersByTime(2_000)
    expect(onExpire).toHaveBeenCalledTimes(1)

    countdown.setExpiresAt(Date.now() + 5_000)
    expect(remaining(countdown)).toBe(5_000)
    vi.advanceTimersByTime(5_000)
    expect(onExpire).toHaveBeenCalledTimes(2)
  })

  it("ignores setting the same deadline again", () => {
    const onExpire = vi.fn()
    const countdown = createCountdown({ expiresAt: START + 2_000, onExpire })
    countdown.setExpiresAt(START + 2_000)
    vi.advanceTimersByTime(2_000)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("stops counting when the deadline is cleared", () => {
    const countdown = createCountdown({ expiresAt: START + 5_000 })
    countdown.setExpiresAt(null)
    expect(remaining(countdown)).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("calls the latest onExpire without restarting", () => {
    const first = vi.fn()
    const second = vi.fn()
    const countdown = createCountdown({ expiresAt: START + 3_000, onExpire: first })
    countdown.setOnExpire(second)
    vi.advanceTimersByTime(3_000)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("stops all timers on destroy", () => {
    const countdown = createCountdown({ expiresAt: START + 60_000 })
    expect(vi.getTimerCount()).toBe(1)
    countdown.destroy()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("stops notifying after unsubscribe", () => {
    const countdown = createCountdown({ expiresAt: START + 5_000 })
    const listener = vi.fn()
    const stop = countdown.subscribe(listener)
    vi.advanceTimersByTime(1_000)
    stop()
    vi.advanceTimersByTime(1_000)
    expect(listener).toHaveBeenCalledTimes(1)
    countdown.destroy()
  })
})
