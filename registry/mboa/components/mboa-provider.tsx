"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { CountryConfig, Locale } from "@/lib/mboa/countries/types"
import { createTranslator, type MessageOverrides, type Translator } from "@/lib/mboa/i18n"

/** Used when neither a prop, the provider nor the country says otherwise. */
export const FALLBACK_LOCALE: Locale = "fr"

interface MboaContextValue {
  country?: CountryConfig
  locale?: Locale
  messages?: MessageOverrides
}

const MboaContext = createContext<MboaContextValue>({})

export interface MboaProviderProps {
  /** Country data shared by every mboa-ui component below. */
  country?: CountryConfig
  /** UI language. Defaults to the country's default locale, then "fr". */
  locale?: Locale
  /** Overrides for individual dictionary strings. Memoize this object to avoid re-renders. */
  messages?: MessageOverrides
  children: ReactNode
}

export function MboaProvider({ country, locale, messages, children }: MboaProviderProps) {
  const value = useMemo(
    () => ({ country, locale: locale ?? country?.defaultLocale, messages }),
    [country, locale, messages]
  )
  return <MboaContext.Provider value={value}>{children}</MboaContext.Provider>
}

/** Raw provider values. Prefer `useCountry`, `useLocale` and `useT` in components. */
export function useMboa(): MboaContextValue {
  return useContext(MboaContext)
}

/**
 * Resolves the country for a component: the `country` prop wins, then the
 * provider. Throws if neither is set, because no component may assume a country.
 */
export function useCountry(country?: CountryConfig): CountryConfig {
  const context = useMboa()
  const resolved = country ?? context.country
  if (!resolved) {
    throw new Error(
      "mboa-ui: no country set. Pass a `country` prop or wrap your app in <MboaProvider country={...}>."
    )
  }
  return resolved
}

/** Resolves the UI language: the `locale` prop, then the provider, then "fr". */
export function useLocale(locale?: Locale): Locale {
  const context = useMboa()
  return locale ?? context.locale ?? FALLBACK_LOCALE
}

/** Returns a translator for the resolved locale, applying the provider's message overrides. */
export function useT(locale?: Locale): Translator {
  const resolved = useLocale(locale)
  const { messages } = useMboa()
  return useMemo(() => createTranslator(resolved, messages), [resolved, messages])
}
