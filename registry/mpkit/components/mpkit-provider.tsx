"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { CountryConfig, Locale } from "@/lib/mpkit/countries/types"
import { createTranslator, type MessageOverrides, type Translator } from "@/lib/mpkit/i18n"

/** Used when neither a prop, the provider nor the country says otherwise. */
export const FALLBACK_LOCALE: Locale = "fr"

interface MpKitContextValue {
  country?: CountryConfig
  locale?: Locale
  messages?: MessageOverrides
}

const MpKitContext = createContext<MpKitContextValue>({})

export interface MpKitProviderProps {
  /** Country data shared by every MP Kit component below. */
  country?: CountryConfig
  /** UI language. Defaults to the country's default locale, then "fr". */
  locale?: Locale
  /** Overrides for individual dictionary strings. Memoize this object to avoid re-renders. */
  messages?: MessageOverrides
  children: ReactNode
}

export function MpKitProvider({ country, locale, messages, children }: MpKitProviderProps) {
  const value = useMemo(
    () => ({ country, locale: locale ?? country?.defaultLocale, messages }),
    [country, locale, messages]
  )
  return <MpKitContext.Provider value={value}>{children}</MpKitContext.Provider>
}

/** Raw provider values. Prefer `useCountry`, `useLocale` and `useT` in components. */
export function useMpKit(): MpKitContextValue {
  return useContext(MpKitContext)
}

/**
 * Resolves the country for a component: the `country` prop wins, then the
 * provider. Throws if neither is set, because no component may assume a country.
 */
export function useCountry(country?: CountryConfig): CountryConfig {
  const context = useMpKit()
  const resolved = country ?? context.country
  if (!resolved) {
    throw new Error(
      "MP Kit: no country set. Pass a `country` prop or wrap your app in <MpKitProvider country={...}>."
    )
  }
  return resolved
}

/** Resolves the UI language: the `locale` prop, then the provider, then "fr". */
export function useLocale(locale?: Locale): Locale {
  const context = useMpKit()
  return locale ?? context.locale ?? FALLBACK_LOCALE
}

/** Returns a translator for the resolved locale, applying the provider's message overrides. */
export function useT(locale?: Locale): Translator {
  const resolved = useLocale(locale)
  const { messages } = useMpKit()
  return useMemo(() => createTranslator(resolved, messages), [resolved, messages])
}
