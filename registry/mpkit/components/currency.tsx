"use client"

import type { ComponentProps } from "react"

import { useLocale, useMpKit } from "@/components/mpkit/mpkit-provider"
import type { CountryConfig, CurrencyCode, Locale } from "@/lib/mpkit/countries/types"
import { formatFcfa, type CurrencyDisplay } from "@/lib/mpkit/format-fcfa"

export interface CurrencyProps extends Omit<ComponentProps<"span">, "children"> {
  /** Amount in CFA francs. Rounded to zero decimals. */
  amount: number
  /** Show "FCFA" (default), the ISO code (XAF/XOF), or the number only. */
  display?: CurrencyDisplay
  /** CFA franc zone. Defaults to the country's currency. */
  currency?: CurrencyCode
  /** Country to take the currency from. Defaults to the one in `MpKitProvider`. */
  country?: CountryConfig
  /** Digit grouping language. Defaults to the provider's locale, then "fr". */
  locale?: Locale
}

/**
 * Displays an amount of CFA francs: zero decimals and French spacing by
 * default, for example `25 000 FCFA`.
 */
export function Currency({
  amount,
  display = "symbol",
  currency,
  country,
  locale,
  ...props
}: CurrencyProps) {
  const context = useMpKit()
  const resolvedLocale = useLocale(locale)
  const resolvedCurrency = currency ?? (country ?? context.country)?.currency

  if (!resolvedCurrency) {
    throw new Error(
      "MP Kit: <Currency /> needs a `currency` or `country` prop, or a <MpKitProvider country={...}> above it."
    )
  }

  return (
    <span {...props}>
      {formatFcfa(amount, { locale: resolvedLocale, currency: resolvedCurrency, display })}
    </span>
  )
}
