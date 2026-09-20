import type { CurrencyCode, Locale } from "@/registry/countries/types"

export type CurrencyDisplay = "symbol" | "code" | "none"

export interface FormatFcfaOptions {
  /** Language used for digit grouping. Defaults to "fr" (25 000). "en" gives 25,000. */
  locale?: Locale
  /** CFA franc zone. Defaults to "XAF". */
  currency?: CurrencyCode
  /** "symbol" shows FCFA, "code" shows the ISO code (XAF/XOF), "none" shows the number only. */
  display?: CurrencyDisplay
}

/** Returned for NaN and infinite input so UI never renders "NaN FCFA". */
export const INVALID_AMOUNT = "—"

const NBSP = " "

const INTL_LOCALES: Record<Locale, string> = { fr: "fr-FR", en: "en-US" }

const formatters = new Map<string, Intl.NumberFormat>()

// Formatters are costly to build; cache them, which matters on low-end phones.
function getFormatter(locale: Locale, currency: CurrencyCode) {
  const key = `${locale}:${currency}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(INTL_LOCALES[locale], {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    formatters.set(key, formatter)
  }
  return formatter
}

/** Label shown next to an amount: "FCFA" or the ISO currency code. */
export function currencyLabel(
  currency: CurrencyCode,
  display: Exclude<CurrencyDisplay, "none"> = "symbol"
) {
  return display === "code" ? currency : "FCFA"
}

/**
 * Formats an amount of CFA francs with zero decimals.
 *
 * Uses `Intl.NumberFormat` for the digits, then builds the string from its parts
 * so the result is the same across engines: a no-break space between digit
 * groups (Intl may emit U+202F or U+00A0 depending on the runtime) and before
 * the currency label, which is always placed after the number.
 *
 * @example
 * formatFcfa(25000) // "25 000 FCFA"
 * formatFcfa(25000, { display: "code" }) // "25 000 XAF"
 * formatFcfa(25000, { locale: "en" }) // "25,000 FCFA"
 */
export function formatFcfa(amount: number, options: FormatFcfaOptions = {}): string {
  const { locale = "fr", currency = "XAF", display = "symbol" } = options

  if (!Number.isFinite(amount)) return INVALID_AMOUNT

  // Values that round to zero would otherwise print as "-0".
  const value = Math.abs(amount) < 0.5 ? 0 : amount

  const number = getFormatter(locale, currency)
    .formatToParts(value)
    .map((part) => {
      switch (part.type) {
        case "minusSign":
          return "-"
        case "integer":
          return part.value
        case "group":
          return part.value.replace(/[  ]/g, NBSP)
        default:
          return "" // currency symbol and literal spaces are re-added below
      }
    })
    .join("")

  return display === "none" ? number : `${number}${NBSP}${currencyLabel(currency, display)}`
}
