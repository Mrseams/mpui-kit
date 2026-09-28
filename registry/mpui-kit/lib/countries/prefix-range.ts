/**
 * Expands an inclusive numeric range of prefixes into individual prefix strings,
 * keeping leading zeros. Handy for copying ranges from a regulator's numbering plan.
 *
 * @example
 * prefixRange("650", "653") // ["650", "651", "652", "653"]
 * prefixRange("6540", "6545") // ["6540", "6541", "6542", "6543", "6544", "6545"]
 */
export function prefixRange(from: string, to: string): string[] {
  if (!/^\d+$/.test(from) || !/^\d+$/.test(to)) {
    throw new RangeError(`prefixRange expects digit strings, got "${from}" and "${to}"`)
  }
  if (from.length !== to.length) {
    throw new RangeError(`prefixRange bounds must have the same length, got "${from}" and "${to}"`)
  }
  const start = Number(from)
  const end = Number(to)
  if (start > end) {
    throw new RangeError(`prefixRange start "${from}" is greater than end "${to}"`)
  }
  return Array.from({ length: end - start + 1 }, (_, i) =>
    String(start + i).padStart(from.length, "0")
  )
}
