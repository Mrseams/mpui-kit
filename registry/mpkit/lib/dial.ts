/** Characters a USSD or short code may contain: digits, *, # and a leading +. */
const DIALABLE = /^\+?[0-9*#]+$/

/** True if `code` looks like something a phone can dial, such as "*126#". */
export function isDialable(code: string): boolean {
  return DIALABLE.test(code)
}

/**
 * Builds a `tel:` link for a USSD code. `#` must be percent-encoded, or the
 * browser treats it as the start of a URL fragment and drops the rest of the
 * code. Returns undefined for anything that is not a dialable code, so a link is
 * never built from arbitrary text.
 *
 * @example
 * dialHref("*126#") // "tel:*126%23"
 * dialHref("#150*50#") // "tel:%23150*50%23"
 */
export function dialHref(code: string): string | undefined {
  const trimmed = code.trim()
  return isDialable(trimmed) ? `tel:${encodeURIComponent(trimmed)}` : undefined
}
