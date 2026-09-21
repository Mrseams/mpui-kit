import { z } from "zod"

import type { CountryConfig, Locale } from "@/lib/mpkit/countries/types"
import { createTranslator, type MessageOverrides } from "@/lib/mpkit/i18n"
import { validatePhone } from "@/lib/mpkit/phone"
import { phoneErrorMessage } from "@/lib/mpkit/phone-errors"

export interface PhoneSchemaOptions {
  /** Language of the error messages. Defaults to the country's default locale. */
  locale?: Locale
  /** Reject numbers whose prefix matches no known operator. */
  requireOperator?: boolean
  /** Id of the operator the number must belong to, e.g. "mtn". */
  operator?: string
  /** Overrides for individual error messages. */
  messages?: MessageOverrides
}

/**
 * A zod schema for a phone number in the given country. It accepts what people
 * type ("6 51 23 45 67", "+237 651 234 567") and outputs the E.164 number.
 *
 * @example
 * const schema = z.object({ phone: createPhoneSchema(cm, { locale: "en" }) })
 * schema.parse({ phone: "6 51 23 45 67" }) // { phone: "+237651234567" }
 */
export function createPhoneSchema(country: CountryConfig, options: PhoneSchemaOptions = {}) {
  const locale = options.locale ?? country.defaultLocale
  const t = createTranslator(locale, options.messages)

  return z.string().transform((value, ctx) => {
    const result = validatePhone(value, country, {
      requireOperator: options.requireOperator,
      operator: options.operator,
    })

    if (!result.valid || !result.e164) {
      ctx.addIssue({
        code: "custom",
        message: phoneErrorMessage(result.issue ?? "empty", {
          country,
          locale,
          t,
          operator: options.operator,
        }),
      })
      return z.NEVER
    }

    return result.e164
  })
}
