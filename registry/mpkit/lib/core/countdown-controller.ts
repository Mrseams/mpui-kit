import { msUntilNextSecond } from "@/lib/mpkit/countdown"
import { createStore, type Listener } from "@/lib/mpkit/core/store"

export interface CountdownSnapshot {
  /** Milliseconds left until the deadline. 0 once the time is up, or when there is no deadline. */
  remainingMs: number
}

export interface CountdownOptions {
  /** The deadline, as a Unix time in milliseconds. Null for "no countdown". */
  expiresAt: number | null
  /** Called once when the countdown reaches zero. */
  onExpire?: () => void
}

export interface CountdownController {
  getSnapshot: () => CountdownSnapshot
  subscribe: (listener: Listener) => () => void
  /** Starts counting down to a new deadline, for example after a retry. */
  setExpiresAt: (expiresAt: number | null) => void
  /** Replaces the expiry callback. Does not restart the countdown. */
  setOnExpire: (onExpire: (() => void) | undefined) => void
  /** Stops the timer and the visibility listener. */
  destroy: () => void
}

/**
 * A countdown with no UI framework in it. It updates once per second, exactly
 * on the second, and always works the time left out from the real clock instead
 * of counting ticks, so it stays correct when the browser throttles or freezes
 * timers. It re-checks as soon as the page is visible again, because people
 * leave the page to dial a USSD code and mobile browsers pause background tabs.
 *
 * @example
 * const countdown = createCountdown({ expiresAt: Date.now() + 90_000, onExpire })
 * countdown.subscribe(() => label.textContent = formatCountdown(countdown.getSnapshot().remainingMs))
 */
export function createCountdown(options: CountdownOptions): CountdownController {
  let expiresAt = options.expiresAt
  let onExpire = options.onExpire
  let timer: ReturnType<typeof setTimeout> | undefined
  let expiredFor: number | null = null
  let stopVisibilityWatch = () => {}

  const remainingNow = () => (expiresAt === null ? 0 : Math.max(0, expiresAt - Date.now()))
  const store = createStore<CountdownSnapshot>({ remainingMs: remainingNow() })

  function tick() {
    clearTimeout(timer)
    if (expiresAt === null) return

    const remainingMs = Math.max(0, expiresAt - Date.now())
    if (remainingMs !== store.getState().remainingMs) store.setState({ remainingMs })

    if (remainingMs <= 0) {
      if (expiredFor !== expiresAt) {
        expiredFor = expiresAt
        onExpire?.()
      }
      return
    }
    timer = setTimeout(tick, msUntilNextSecond(remainingMs))
  }

  function stop() {
    clearTimeout(timer)
    stopVisibilityWatch()
    stopVisibilityWatch = () => {}
  }

  function start() {
    stop()
    if (expiresAt === null) {
      if (store.getState().remainingMs !== 0) store.setState({ remainingMs: 0 })
      return
    }
    if (typeof document !== "undefined") {
      const onVisible = () => {
        if (document.visibilityState === "visible") tick()
      }
      document.addEventListener("visibilitychange", onVisible)
      stopVisibilityWatch = () => document.removeEventListener("visibilitychange", onVisible)
    }
    tick()
  }

  start()

  return {
    getSnapshot: store.getState,
    subscribe: store.subscribe,
    setExpiresAt(next) {
      if (next === expiresAt) return
      expiresAt = next
      expiredFor = null
      start()
    },
    setOnExpire(next) {
      onExpire = next
    },
    destroy: stop,
  }
}
