/**
 * The public entry point of the framework-free core, and of the npm package
 * built from it. Everything here works in the browser, in Node, and with any UI
 * framework: React, Vue, Svelte, Solid, or plain JavaScript.
 *
 * (This file is not part of the shadcn registry. The registry ships each file
 * on its own, so an app only installs what it uses.)
 */

// Controllers: state you subscribe to.
export { createStore, type Listener, type Store } from "@/lib/mboa/core/store"
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
} from "@/lib/mboa/core/checkout-controller"
export {
  applyPhoneEdit,
  createPhoneField,
  type PhoneEdit,
  type PhoneEditResult,
  type PhoneFieldController,
  type PhoneFieldOptions,
  type PhoneFieldSnapshot,
} from "@/lib/mboa/core/phone-field"
export {
  createCountdown,
  type CountdownController,
  type CountdownOptions,
  type CountdownSnapshot,
} from "@/lib/mboa/core/countdown-controller"

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
} from "@/lib/mboa/checkout-machine"
export { formatFcfa, currencyLabel, type CurrencyDisplay } from "@/lib/mboa/format-fcfa"
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
} from "@/lib/mboa/phone"
export { phoneErrorMessage } from "@/lib/mboa/phone-errors"
export {
  defaultPaymentMethods,
  emptySelection,
  paymentMethodLabel,
  resolvePayment,
  type PaymentMethod,
  type PaymentMethodKind,
  type PaymentSelection,
  type ResolvedPayment,
} from "@/lib/mboa/payment-methods"
export { formatCountdown, announcementBucket, msUntilNextSecond } from "@/lib/mboa/countdown"
export { dialHref, isDialable } from "@/lib/mboa/dial"
export { copyToClipboard } from "@/lib/mboa/clipboard"
export { formatDateTime } from "@/lib/mboa/format-date"

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
} from "@/lib/mboa/i18n"

// Countries.
export { prefixRange } from "@/lib/mboa/countries/prefix-range"
export { cm } from "@/lib/mboa/countries/cm"
export type {
  CountryConfig,
  CurrencyCode,
  Locale,
  LocalizedString,
  OperatorConfig,
  Region,
} from "@/lib/mboa/countries/types"
