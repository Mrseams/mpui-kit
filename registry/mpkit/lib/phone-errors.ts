import type { CountryConfig, Locale } from "@/lib/mpkit/countries/types"
import type { Translator } from "@/lib/mpkit/i18n"
import type { PhoneIssue } from "@/lib/mpkit/phone"

interface PhoneErrorContext {
  country: CountryConfig
  locale: Locale
  t: Translator
  /** Id of the operator the number was required to match, for "operator_mismatch". */
  operator?: string
}

/** Turns a phone validation issue into a translated, user-facing message. */
export function phoneErrorMessage(
  issue: PhoneIssue,
  { country, locale, t, operator }: PhoneErrorContext
): string {
  const length = country.nationalNumberLength
  switch (issue) {
    case "empty":
      return t("phone.error.empty")
    case "too_short":
      return t("phone.error.tooShort", { length })
    case "too_long":
      return t("phone.error.tooLong", { length })
    case "wrong_country":
      return t("phone.error.wrongCountry", { country: country.name[locale] })
    case "invalid_chars":
      return t("phone.error.invalidChars")
    case "unknown_operator":
      return t("phone.error.unknownOperator")
    case "operator_mismatch": {
      const name = country.operators.find((item) => item.id === operator)?.name ?? operator ?? ""
      return t("phone.error.operatorMismatch", { operator: name })
    }
  }
}
