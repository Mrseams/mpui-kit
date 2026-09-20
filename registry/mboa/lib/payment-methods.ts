import type { CountryConfig, OperatorConfig } from "@/lib/mboa/countries/types"
import type { Translator } from "@/lib/mboa/i18n"
import { validatePhone, type PhoneValidation } from "@/lib/mboa/phone"

export type PaymentMethodKind = "mobile_money" | "card" | "cash"

export interface PaymentMethod {
  /** Unique id. For Mobile Money this is the operator id, e.g. "mtn". */
  id: string
  kind: PaymentMethodKind
  /** Required for "mobile_money": the operator that runs the wallet. */
  operatorId?: string
  /** Overrides the built-in label. */
  label?: string
  /** Overrides the built-in description. */
  description?: string
}

/** What the user has chosen so far. `phone` is the national number as digits. */
export interface PaymentSelection {
  methodId: string | null
  phone: string
}

export interface ResolvedPayment {
  method: PaymentMethod | null
  operator: OperatorConfig | null
  /** Validation of the phone number. Only set for Mobile Money. */
  phone: PhoneValidation | null
  /** E.164 number for Mobile Money once valid, otherwise null. */
  e164: string | null
  /** True when the selection is complete and can be paid. */
  ready: boolean
}

export interface DefaultPaymentMethodsOptions {
  /** Offer card payment. Defaults to true. */
  card?: boolean
  /** Offer cash payment. Defaults to true. */
  cash?: boolean
}

export const emptySelection: PaymentSelection = { methodId: null, phone: "" }

/**
 * The payment methods a country offers by default: one Mobile Money method per
 * operator that has a wallet, then card and cash.
 */
export function defaultPaymentMethods(
  country: CountryConfig,
  { card = true, cash = true }: DefaultPaymentMethodsOptions = {}
): PaymentMethod[] {
  const methods: PaymentMethod[] = country.operators
    .filter((operator) => operator.mobileMoneyName)
    .map((operator) => ({ id: operator.id, kind: "mobile_money", operatorId: operator.id }))
  if (card) methods.push({ id: "card", kind: "card" })
  if (cash) methods.push({ id: "cash", kind: "cash" })
  return methods
}

/**
 * Works out whether a selection can be paid. Mobile Money needs a valid phone
 * number that does not belong to a different known operator. Card and cash are
 * ready as soon as they are chosen.
 */
export function resolvePayment(
  selection: PaymentSelection,
  methods: PaymentMethod[],
  country: CountryConfig
): ResolvedPayment {
  const method = methods.find((item) => item.id === selection.methodId) ?? null
  if (!method) return { method: null, operator: null, phone: null, e164: null, ready: false }

  if (method.kind !== "mobile_money") {
    return { method, operator: null, phone: null, e164: null, ready: true }
  }

  const operator = country.operators.find((item) => item.id === method.operatorId) ?? null
  const phone = validatePhone(selection.phone, country, { operator: method.operatorId })
  return { method, operator, phone, e164: phone.e164, ready: phone.valid }
}

/**
 * A readable name for a payment method id: the wallet name for a Mobile Money
 * operator ("MTN Mobile Money"), "Bank card" or "Cash", or the id itself for
 * anything custom.
 */
export function paymentMethodLabel(
  methodId: string,
  country: CountryConfig,
  t: Translator
): string {
  const operator = country.operators.find((item) => item.id === methodId)
  if (operator) return operator.mobileMoneyName ?? operator.name
  if (methodId === "card") return t("picker.card")
  if (methodId === "cash") return t("picker.cash")
  return methodId
}
