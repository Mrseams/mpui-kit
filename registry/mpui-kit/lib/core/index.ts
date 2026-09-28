/**
 * The public entry point of the framework-free core, and of the npm package
 * built from it. Everything here works in the browser, in Node, and with any UI
 * framework: React, Vue, Svelte, Solid, or plain JavaScript.
 *
 * (This file is not part of the shadcn registry. The registry ships each file
 * on its own, so an app only installs what it uses.)
 */

// Controllers: state you subscribe to.
export { createStore, type Listener, type Store } from "@/lib/mpui-kit/core/store"
export {
  createCheckoutController,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  MAX_STATUS_ERRORS,
  type CheckoutController,
  type CheckoutOptions,
  type CheckoutSnapshot,
  type PayResult,
  type PaymentInput,
  type PaymentRequest,
  type StartedPayment,
  type StatusContext,
  type StatusResult,
} from "@/lib/mpui-kit/core/checkout-controller"
export {
  applyPhoneEdit,
  createPhoneField,
  type PhoneEdit,
  type PhoneEditResult,
  type PhoneFieldController,
  type PhoneFieldOptions,
  type PhoneFieldSnapshot,
} from "@/lib/mpui-kit/core/phone-field"
export {
  createCountdown,
  type CountdownController,
  type CountdownOptions,
  type CountdownSnapshot,
} from "@/lib/mpui-kit/core/countdown-controller"

// The payment state machine and the pure helpers.
export {
  checkoutReducer,
  initialCheckoutState,
  isPending,
  isSettled,
  remainingMs,
  type CheckoutEvent,
  type CheckoutState,
  type CheckoutStatus,
  type PaymentReceipt,
} from "@/lib/mpui-kit/checkout-machine"
export { formatFcfa, currencyLabel, type CurrencyDisplay } from "@/lib/mpui-kit/format-fcfa"
export {
  caretIndexAfterDigits,
  countDigits,
  detectOperator,
  formatInternational,
  formatNational,
  normalizePhoneInput,
  parseNationalNumber,
  toE164,
  validatePhone,
  type PhoneIssue,
  type PhoneValidation,
} from "@/lib/mpui-kit/phone"
export { phoneErrorMessage } from "@/lib/mpui-kit/phone-errors"
export {
  defaultPaymentMethods,
  emptySelection,
  paymentMethodLabel,
  resolvePayment,
  type PaymentMethod,
  type PaymentMethodKind,
  type PaymentSelection,
  type ResolvedPayment,
} from "@/lib/mpui-kit/payment-methods"
export { formatCountdown, announcementBucket, msUntilNextSecond } from "@/lib/mpui-kit/countdown"
export { dialHref, isDialable } from "@/lib/mpui-kit/dial"
export { copyToClipboard } from "@/lib/mpui-kit/clipboard"
export { formatDateTime } from "@/lib/mpui-kit/format-date"

// Text.
export {
  createTranslator,
  interpolate,
  messages,
  translate,
  type MessageKey,
  type MessageOverrides,
  type Messages,
  type Translator,
} from "@/lib/mpui-kit/i18n"

// Countries.
export { prefixRange } from "@/lib/mpui-kit/countries/prefix-range"
export { cm } from "@/lib/mpui-kit/countries/cm"
export type {
  CountryConfig,
  CurrencyCode,
  Locale,
  LocalizedString,
  OperatorConfig,
  Region,
} from "@/lib/mpui-kit/countries/types"
