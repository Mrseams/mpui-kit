export type Locale = "fr" | "en"

/** Currencies of the CFA franc zones: XAF (CEMAC, e.g. Cameroon) and XOF (UEMOA, e.g. Senegal). */
export type CurrencyCode = "XAF" | "XOF"

export type LocalizedString = Record<Locale, string>

export interface OperatorConfig {
  /** Stable machine id, e.g. "mtn". Used as a key and in payment requests. */
  id: string
  /** Display name shown in badges. Plain text only, no logos. */
  name: string
  /** Set only if the operator offers a mobile money wallet. Shown in the payment picker. */
  mobileMoneyName?: string
  /** Neutral CSS color for the badge dot. Not a brand asset. */
  color: string
  /**
   * National-number prefixes (without calling code or trunk prefix), digits only.
   * A prefix may be shorter than the full number, e.g. "66" or "655".
   * Prefixes must not overlap across operators; the country tests enforce this.
   */
  prefixes: string[]
}

export interface Region {
  id: string
  name: LocalizedString
  cities: string[]
}

export interface CountryConfig {
  /** ISO 3166-1 alpha-2 code, uppercase, e.g. "CM". */
  iso: string
  name: LocalizedString
  /** International calling code, digits only, without "+", e.g. "237". */
  callingCode: string
  /** Number of digits in a national number, excluding calling code and trunk prefix. */
  nationalNumberLength: number
  /** Domestic dialing prefix stripped from user input, e.g. "0". Omit if the country has none. */
  trunkPrefix?: string
  /** Digit group sizes for display, e.g. [1, 2, 2, 2, 2]. Must sum to nationalNumberLength. */
  groupSizes: number[]
  operators: OperatorConfig[]
  currency: CurrencyCode
  /** Locales the country's UI should offer. Must contain defaultLocale. */
  locales: Locale[]
  defaultLocale: Locale
  regions: Region[]
}
