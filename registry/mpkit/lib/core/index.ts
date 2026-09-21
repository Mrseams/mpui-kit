/**
 * The public entry point of the framework-free core, and of the npm package
 * built from it. Everything here works in the browser, in Node, and with any UI
 * framework: React, Vue, Svelte, Solid, or plain JavaScript.
 *
 * (This file is not part of the shadcn registry. The registry ships each file
 * on its own, so an app only installs what it uses.)
 */

// Controllers: state you subscribe to.
export { createStore, type Listener, type Store } from "@/lib/mpkit/core/store"
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
} from "@/lib/mpkit/core/checkout-controller"
export {
  applyPhoneEdit,
  createPhoneField,
  type PhoneEdit,
  type PhoneEditResult,
  type PhoneFieldController,
  type PhoneFieldOptions,
  type PhoneFieldSnapshot,
} from "@/lib/mpkit/core/phone-field"
export {
  createCountdown,
  type CountdownController,
  type CountdownOptions,
  type CountdownSnapshot,
} from "@/lib/mpkit/core/countdown-controller"

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
} from "@/lib/mpkit/checkout-machine"
export { formatFcfa, currencyLabel, type CurrencyDisplay } from "@/lib/mpkit/format-fcfa"
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
} from "@/lib/mpkit/phone"
export { phoneErrorMessage } from "@/lib/mpkit/phone-errors"
export {
  defaultPaymentMethods,
  emptySelection,
  paymentMethodLabel,
  resolvePayment,
  type PaymentMethod,
  type PaymentMethodKind,
  type PaymentSelection,
  type ResolvedPayment,
} from "@/lib/mpkit/payment-methods"
export { formatCountdown, announcementBucket, msUntilNextSecond } from "@/lib/mpkit/countdown"
export { dialHref, isDialable } from "@/lib/mpkit/dial"
export { copyToClipboard } from "@/lib/mpkit/clipboard"
export { formatDateTime } from "@/lib/mpkit/format-date"

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
} from "@/lib/mpkit/i18n"

// Countries.
export { prefixRange } from "@/lib/mpkit/countries/prefix-range"
export { cm } from "@/lib/mpkit/countries/cm"
export type {
  CountryConfig,
  CurrencyCode,
  Locale,
  LocalizedString,
  OperatorConfig,
  Region,
} from "@/lib/mpkit/countries/types"
