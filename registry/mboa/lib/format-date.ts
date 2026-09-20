import type { Locale } from "@/lib/mboa/countries/types"

const INTL_LOCALES: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" }

/**
 * Formats a Unix time (ms) as a short date and time in the user's language,
 * for example "1 janv. 2026, 12:00". Uses the device's time zone unless one is given.
 */
export function formatDateTime(timestamp: number, locale: Locale, timeZone?: string): string {
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(timestamp)
}
