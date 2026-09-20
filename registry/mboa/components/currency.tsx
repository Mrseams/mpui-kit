"use client"

import type { ComponentProps } from "react"

import { useLocale, useMboa } from "@/components/mboa/mboa-provider"
import type { CountryConfig, CurrencyCode, Locale } from "@/lib/mboa/countries/types"
import { formatFcfa, type CurrencyDisplay } from "@/lib/mboa/format-fcfa"

export interface CurrencyProps extends Omit<ComponentProps<"span">, "children"> {
  /** Amount in CFA francs. Rounded to zero decimals. */
  amount: number
  /** Show "FCFA" (default), the ISO code (XAF/XOF), or the number only. */
  display?: CurrencyDisplay
  /** CFA franc zone. Defaults to the country's currency. */
  currency?: CurrencyCode
  /** Country to take the currency from. Defaults to the one in `MboaProvider`. */
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
  const context = useMboa()
  const resolvedLocale = useLocale(locale)
  const resolvedCurrency = currency ?? (country ?? context.country)?.currency

  if (!resolvedCurrency) {
    throw new Error(
      "mboa-ui: <Currency /> needs a `currency` or `country` prop, or a <MboaProvider country={...}> above it."
    )
  }

  return (
    <span {...props}>
      {formatFcfa(amount, { locale: resolvedLocale, currency: resolvedCurrency, display })}
    </span>
  )
}
