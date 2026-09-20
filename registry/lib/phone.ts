import type { CountryConfig, OperatorConfig } from "@/registry/countries/types"

export type PhoneIssue =
  "empty" | "invalid_chars" | "wrong_country" | "too_short" | "too_long" | "unknown_operator"

export interface PhoneValidation {
  valid: boolean
  issue?: PhoneIssue
  /** National significant number: digits only, no calling code, no trunk prefix. */
  national: string
  /** E.164 number such as "+237671234567". Only set when `valid` is true. */
  e164: string | null
  /** Operator detected from the prefix, even while the number is still incomplete. */
  operator: OperatorConfig | null
}

export interface ValidatePhoneOptions {
  /** Treat numbers whose prefix matches no operator as invalid. Defaults to false. */
  requireOperator?: boolean
}

// Digits plus the separators people type or paste: space, +, (, ), ., -
const ALLOWED_CHARS = /^[\d\s+().-]*$/

interface ParsedNational {
  national: string
  issue?: "invalid_chars" | "wrong_country"
}

/**
 * Extracts the national number from whatever the user typed or pasted.
 *
 * Accepts "671234567", "6 71 23 45 67", "+237 671 234 567", "00237671234567"
 * and a bare "237671234567". A bare calling code is only stripped when the
 * digits are long enough to be calling code + full national number, because a
 * national number can itself start with the same digits.
 *
 * The result is not truncated, so callers can tell "too long" from "valid".
 */
export function parseNationalNumber(raw: string, country: CountryConfig): ParsedNational {
  const trimmed = raw.trim()
  const digits = trimmed.replace(/\D/g, "")
  const invalidChars = !ALLOWED_CHARS.test(trimmed)
  const { callingCode, nationalNumberLength, trunkPrefix } = country

  const finish = (national: string, issue?: ParsedNational["issue"]): ParsedNational => ({
    national,
    ...(invalidChars ? { issue: "invalid_chars" as const } : issue ? { issue } : {}),
  })

  const explicitInternational = trimmed.startsWith("+") || digits.startsWith("00")
  if (explicitInternational) {
    const rest = trimmed.startsWith("+") ? digits : digits.slice(2)
    // Still typing the calling code, e.g. "+2" or "+23".
    if (callingCode.startsWith(rest)) return finish("")
    if (!rest.startsWith(callingCode)) return finish(rest, "wrong_country")
    return finish(rest.slice(callingCode.length))
  }

  if (
    digits.startsWith(callingCode) &&
    digits.length >= callingCode.length + nationalNumberLength
  ) {
    return finish(digits.slice(callingCode.length))
  }

  if (trunkPrefix && digits.startsWith(trunkPrefix)) {
    return finish(digits.slice(trunkPrefix.length))
  }

  return finish(digits)
}

/**
 * Normalizes typed input to at most `nationalNumberLength` national digits.
 * Use it to drive a controlled input while the user types.
 */
export function normalizePhoneInput(raw: string, country: CountryConfig): string {
  return parseNationalNumber(raw, country).national.slice(0, country.nationalNumberLength)
}

/**
 * Finds the operator whose prefix the number starts with, using the longest
 * matching prefix. Returns null until enough digits are typed to match, e.g.
 * "65" matches nothing but "655" matches.
 */
export function detectOperator(national: string, country: CountryConfig): OperatorConfig | null {
  let best: { operator: OperatorConfig; length: number } | null = null
  for (const operator of country.operators) {
    for (const prefix of operator.prefixes) {
      if (national.startsWith(prefix) && (!best || prefix.length > best.length)) {
        best = { operator, length: prefix.length }
      }
    }
  }
  return best ? best.operator : null
}

/** Groups national digits for display, e.g. "671234567" -> "6 71 23 45 67". Works on partial input. */
export function formatNational(national: string, country: CountryConfig): string {
  const groups: string[] = []
  let cursor = 0
  for (const size of country.groupSizes) {
    if (cursor >= national.length) break
    groups.push(national.slice(cursor, cursor + size))
    cursor += size
  }
  if (cursor < national.length) groups.push(national.slice(cursor))
  return groups.join(" ")
}

/** "+237 6 71 23 45 67" */
export function formatInternational(national: string, country: CountryConfig): string {
  return `+${country.callingCode} ${formatNational(national, country)}`.trim()
}

export function validatePhone(
  raw: string,
  country: CountryConfig,
  options: ValidatePhoneOptions = {}
): PhoneValidation {
  const { national, issue: parseIssue } = parseNationalNumber(raw, country)
  const operator = detectOperator(national, country)

  const fail = (issue: PhoneIssue): PhoneValidation => ({
    valid: false,
    issue,
    national,
    e164: null,
    operator,
  })

  if (parseIssue) return fail(parseIssue)
  if (national.length === 0) return fail("empty")
  if (national.length < country.nationalNumberLength) return fail("too_short")
  if (national.length > country.nationalNumberLength) return fail("too_long")
  if (options.requireOperator && !operator) return fail("unknown_operator")

  return { valid: true, national, e164: `+${country.callingCode}${national}`, operator }
}

/** Returns the E.164 number, or null if the input is not a valid number for the country. */
export function toE164(
  raw: string,
  country: CountryConfig,
  options?: ValidatePhoneOptions
): string | null {
  return validatePhone(raw, country, options).e164
}
