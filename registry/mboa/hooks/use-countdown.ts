"use client"

import { useEffect, useRef, useState } from "react"

import { msUntilNextSecond } from "@/lib/mboa/countdown"

interface UseCountdownOptions {
  /** Called once when the countdown reaches zero. */
  onExpire?: () => void
}

/**
 * Milliseconds left until `expiresAt` (a Unix time in ms), updated once per
 * second. Pass null for "no countdown". Returns 0 once the time is up.
 *
 * The remaining time is always computed from the real clock, never by counting
 * ticks, so it stays correct when the browser throttles or freezes timers. That
 * matters here: people leave the page to dial a USSD code, and mobile browsers
 * pause background tabs. The countdown re-syncs as soon as the tab is visible
 * again.
 */
export function useCountdown(
  expiresAt: number | null,
  { onExpire }: UseCountdownOptions = {}
): number {
  const [now, setNow] = useState(() => Date.now())
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    if (expiresAt === null) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let expired = false

    function tick() {
      clearTimeout(timer)
      const current = Date.now()
      setNow(current)
      const remaining = (expiresAt as number) - current
      if (remaining <= 0) {
        if (!expired) {
          expired = true
          onExpireRef.current?.()
        }
        return
      }
      timer = setTimeout(tick, msUntilNextSecond(remaining))
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") tick()
    }

    tick()
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [expiresAt])

  return expiresAt === null ? 0 : Math.max(0, expiresAt - now)
}
