/**
 * Formats a duration as m:ss for a countdown. Rounds up so the display never
 * shows 0:00 while time is still left, and clamps negatives to 0:00.
 *
 * @example
 * formatCountdown(90_000) // "1:30"
 * formatCountdown(1) // "0:01"
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 1000)) : 0
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

/**
 * Milliseconds until a countdown that shows whole seconds (see formatCountdown)
 * next changes what it displays. Schedule the next tick with this instead of a
 * fixed interval, so the display flips exactly on the second and the timer does
 * not drift or wake the CPU more than once a second.
 *
 * @example
 * msUntilNextSecond(90_000) // 1000: the display goes 1:30 -> 1:29 after a second
 * msUntilNextSecond(90_400) // 400: 1:31 -> 1:30 after 400 ms
 */
export function msUntilNextSecond(remainingMs: number): number {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return 0
  return ((Math.ceil(remainingMs) - 1) % 1000) + 1
}

/**
 * Coarse milestone, in seconds, for announcing a countdown to screen readers
 * without reading out every second: 10, 30 and 60 seconds, then each whole
 * minute above that. The value only changes when a milestone is crossed, so
 * use it as the trigger for an aria-live update.
 *
 * @example
 * announcementBucket(125_000) // 180 (within 3 minutes)
 * announcementBucket(45_000) // 60
 * announcementBucket(8_000) // 10
 */
export function announcementBucket(remainingMs: number): number {
  const seconds = Number.isFinite(remainingMs) ? Math.ceil(remainingMs / 1000) : 0
  if (seconds <= 0) return 0
  if (seconds <= 10) return 10
  if (seconds <= 30) return 30
  if (seconds <= 60) return 60
  return Math.ceil(seconds / 60) * 60
}
