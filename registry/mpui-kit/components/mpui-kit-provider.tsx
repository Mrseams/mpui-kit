"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { CountryConfig, Locale } from "@/lib/mpui-kit/countries/types"
import { createTranslator, type MessageOverrides, type Translator } from "@/lib/mpui-kit/i18n"

/** Used when neither a prop, the provider nor the country says otherwise. */
export const FALLBACK_LOCALE: Locale = "fr"

interface MpuiKitContextValue {
  country?: CountryConfig
  locale?: Locale
  messages?: MessageOverrides
}

const MpuiKitContext = createContext<MpuiKitContextValue>({})

export interface MpuiKitProviderProps {
  /** Country data shared by every MPUI-KIT component below. */
  country?: CountryConfig
  /** UI language. Defaults to the country's default locale, then "fr". */
  locale?: Locale
  /** Overrides for individual dictionary strings. Memoize this object to avoid re-renders. */
  messages?: MessageOverrides
  children: ReactNode
}

export function MpuiKitProvider({ country, locale, messages, children }: MpuiKitProviderProps) {
  const value = useMemo(
    () => ({ country, locale: locale ?? country?.defaultLocale, messages }),
    [country, locale, messages]
  )
  return <MpuiKitContext.Provider value={value}>{children}</MpuiKitContext.Provider>
}

/** Raw provider values. Prefer `useCountry`, `useLocale` and `useT` in components. */
export function useMpuiKit(): MpuiKitContextValue {
  return useContext(MpuiKitContext)
}

/**
 * Resolves the country for a component: the `country` prop wins, then the
 * provider. Throws if neither is set, because no component may assume a country.
 */
export function useCountry(country?: CountryConfig): CountryConfig {
  const context = useMpuiKit()
  const resolved = country ?? context.country
  if (!resolved) {
    throw new Error(
      "MPUI-KIT: no country set. Pass a `country` prop or wrap your app in <MpuiKitProvider country={...}>."
    )
  }
  return resolved
}

/** Resolves the UI language: the `locale` prop, then the provider, then "fr". */
export function useLocale(locale?: Locale): Locale {
  const context = useMpuiKit()
  return locale ?? context.locale ?? FALLBACK_LOCALE
}

/** Returns a translator for the resolved locale, applying the provider's message overrides. */
export function useT(locale?: Locale): Translator {
  const resolved = useLocale(locale)
  const { messages } = useMpuiKit()
  return useMemo(() => createTranslator(resolved, messages), [resolved, messages])
}
