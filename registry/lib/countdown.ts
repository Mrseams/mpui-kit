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
