// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useCountdown } from "@/hooks/mpkit/use-countdown"

const START = new Date("2026-01-01T12:00:00Z").getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useCountdown", () => {
  it("returns the time left and counts down once per second", () => {
    const { result } = renderHook(() => useCountdown(START + 5_000))
    expect(result.current).toBe(5_000)

    act(() => {
      vi.advanceTimersByTime(1_000)
    })
    expect(result.current).toBe(4_000)

    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(result.current).toBe(2_000)
  })

  it("stops at zero and calls onExpire exactly once", () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useCountdown(START + 3_000, { onExpire }))

    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(result.current).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(result.current).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("expires immediately when the deadline has already passed", () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useCountdown(START - 1_000, { onExpire }))
    expect(result.current).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("does nothing without a deadline", () => {
    const onExpire = vi.fn()
    const { result } = renderHook(() => useCountdown(null, { onExpire }))
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(result.current).toBe(0)
    expect(onExpire).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it("restarts when the deadline changes, for example after a retry", () => {
    const onExpire = vi.fn()
    const { result, rerender } = renderHook(
      ({ expiresAt }) => useCountdown(expiresAt, { onExpire }),
      { initialProps: { expiresAt: START + 2_000 } }
    )
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(onExpire).toHaveBeenCalledTimes(1)

    rerender({ expiresAt: START + 2_000 + 5_000 })
    expect(result.current).toBe(5_000)
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(result.current).toBe(0)
    expect(onExpire).toHaveBeenCalledTimes(2)
  })

  it("stays correct when timers are frozen and the tab becomes visible again", () => {
    const { result } = renderHook(() => useCountdown(START + 60_000))

    // The browser freezes timers (user is in the dialer) while the clock keeps running.
    vi.setSystemTime(START + 45_000)
    expect(result.current).toBe(60_000)

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(result.current).toBe(15_000)
  })

  it("calls the latest onExpire without restarting the timer", () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ onExpire }) => useCountdown(START + 3_000, { onExpire }), {
      initialProps: { onExpire: first },
    })
    rerender({ onExpire: second })
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("cleans up its timer and listener on unmount", () => {
    const { unmount } = renderHook(() => useCountdown(START + 60_000))
    expect(vi.getTimerCount()).toBe(1)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
