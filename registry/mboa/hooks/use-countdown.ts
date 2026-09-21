"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import { createCountdown } from "@/lib/mboa/core/countdown-controller"

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
 *
 * A thin layer over `createCountdown`, which works in any framework.
 */
export function useCountdown(
  expiresAt: number | null,
  { onExpire }: UseCountdownOptions = {}
): number {
  const [countdown] = useState(() => createCountdown({ expiresAt, onExpire }))

  useEffect(() => {
    countdown.setOnExpire(onExpire)
  })
  useEffect(() => {
    countdown.setExpiresAt(expiresAt)
  }, [countdown, expiresAt])
  useEffect(() => () => countdown.destroy(), [countdown])

  const remainingMs = useSyncExternalStore(
    countdown.subscribe,
    () => countdown.getSnapshot().remainingMs,
    () => countdown.getSnapshot().remainingMs
  )
  return expiresAt === null ? 0 : remainingMs
}
