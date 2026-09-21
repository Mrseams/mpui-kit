import {
  checkoutReducer,
  initialCheckoutState,
  type CheckoutEvent,
  type CheckoutState,
  type PaymentReceipt,
} from "@/lib/mpkit/checkout-machine"
import { createStore, type Listener } from "@/lib/mpkit/core/store"
import type { CurrencyCode } from "@/lib/mpkit/countries/types"

/** What the user chose to pay with. */
export interface PaymentInput {
  /** Id of the payment method, e.g. "mtn", "card", "paypal" or "cash". */
  methodId: string
  /** E.164 number, for Mobile Money. */
  phone?: string
  /**
   * Anything your payment method needs to send to your backend, for example a
   * Stripe confirmation token or a PayPal order id. MP Kit never looks inside
   * it and never asks for card details: get the token from your provider's own
   * hosted fields.
   */
  payload?: unknown
}

/** A payment as it was when the user pressed Pay. The amount is fixed from that moment. */
export interface StartedPayment extends PaymentInput {
  amount: number
  currency: CurrencyCode
}

export interface PaymentRequest extends StartedPayment {
  /** 1 for the first try, then 2, 3... after each retry. Handy for idempotency keys. */
  attempt: number
  /** Aborted when the user cancels, the request times out or the checkout is destroyed. */
  signal: AbortSignal
}

/** What `onPay` returns. */
export type PayResult =
  /** Paid already, for example a backend that waits for approval, or cash. */
  | { status: "success"; reference: string }
  /** Started. The controller then polls `onCheckStatus` with this reference. */
  | { status: "pending"; reference: string; ussdCode?: string }
  | { status: "failed"; reason?: string }

/** What `onCheckStatus` returns. */
export type StatusResult =
  | { status: "pending" }
  | { status: "success"; reference?: string }
  | { status: "failed"; reason?: string }

export interface StatusContext {
  attempt: number
  signal: AbortSignal
}

export interface CheckoutOptions {
  amount: number
  currency: CurrencyCode
  /** Starts the payment on your backend. Never called by MP Kit itself. */
  onPay: (request: PaymentRequest) => Promise<PayResult>
  /** Asks your backend for the result of a pending payment. Called every `pollIntervalMs`. */
  onCheckStatus?: (reference: string, context: StatusContext) => Promise<StatusResult>
  /** How long to wait for approval before timing out. Defaults to 2 minutes. */
  timeoutMs?: number
  /** Time between status checks. Defaults to 3 seconds. */
  pollIntervalMs?: number
}

/** Everything a UI needs to draw the checkout. The same object is returned until something changes. */
export interface CheckoutSnapshot {
  state: CheckoutState
  /**
   * The payment in progress, with the amount and currency from when the user
   * pressed Pay. Changing the `amount` option afterwards does not affect it.
   * Null until the first payment starts.
   */
  payment: StartedPayment | null
}

export interface CheckoutController {
  getSnapshot: () => CheckoutSnapshot
  subscribe: (listener: Listener) => () => void
  /**
   * Updates the options. Use it to hand over new callbacks or a new amount: a
   * payment already running keeps the amount it started with, and picks up the
   * new `onCheckStatus` on its next check.
   */
  setOptions: (options: Partial<CheckoutOptions>) => void
  /** Starts a payment. Ignored unless the checkout is idle. */
  pay: (input: PaymentInput) => void
  /** Tries again after a failure or timeout, with the same payment details. */
  retry: () => void
  /** Stops waiting and returns to idle. Does not cancel anything on your backend. */
  cancel: () => void
  /** Returns to idle from any state, for example after a receipt or to change method. */
  reset: () => void
  /** Stops all timers and requests. Call it when the UI goes away. */
  destroy: () => void
}

export const DEFAULT_TIMEOUT_MS = 120_000
export const DEFAULT_POLL_INTERVAL_MS = 3_000
/** Consecutive failed status checks tolerated before the payment is marked as failed. */
export const MAX_STATUS_ERRORS = 5

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : undefined)

/** Resolves after `ms`, or immediately when `signal` is aborted. */
function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve()
    const timer = setTimeout(done, ms)
    function done() {
      clearTimeout(timer)
      signal.removeEventListener("abort", done)
      resolve()
    }
    signal.addEventListener("abort", done)
  })
}

interface ActiveAttempt {
  attempt: number
  abort: AbortController
  timer: ReturnType<typeof setTimeout>
  stopVisibilityWatch: () => void
}

/**
 * The payment flow with no UI framework in it: idle, awaiting approval, success,
 * failed and timeout. It calls your `onPay`, polls `onCheckStatus` while the
 * user approves on their phone, times out, and cleans up.
 *
 * Results that arrive after the user cancelled, retried or timed out are
 * ignored, so a slow response can never change the wrong attempt.
 *
 * @example
 * const checkout = createCheckoutController({ amount: 25000, currency: "XAF", onPay })
 * const stop = checkout.subscribe(() => render(checkout.getSnapshot()))
 * checkout.pay({ methodId: "mtn", phone: "+237651234567" })
 */
export function createCheckoutController(initialOptions: CheckoutOptions): CheckoutController {
  let options = initialOptions
  const store = createStore<CheckoutSnapshot>({ state: initialCheckoutState, payment: null })
  let active: ActiveAttempt | null = null

  function apply(event: CheckoutEvent, payment: StartedPayment | null = store.getState().payment) {
    const current = store.getState()
    const next = checkoutReducer(current.state, event)
    if (next === current.state && payment === current.payment) return
    store.setState({ state: next, payment })
    syncAttempt(next)
  }

  /** Starts or stops the background work so it matches the state. */
  function syncAttempt(state: CheckoutState) {
    const awaiting = state.status === "awaiting_approval" ? state : null
    if (active && (!awaiting || awaiting.attempt !== active.attempt)) stopAttempt()
    if (awaiting && !active) startAttempt(awaiting.attempt, awaiting.expiresAt)
  }

  function stopAttempt() {
    if (!active) return
    active.abort.abort()
    clearTimeout(active.timer)
    active.stopVisibilityWatch()
    active = null
  }

  function startAttempt(attempt: number, expiresAt: number) {
    const abort = new AbortController()

    // Time out when the deadline passes. Never before it, even if the timer
    // fires a millisecond early.
    const timer = setTimeout(
      () => apply({ type: "tick", now: Math.max(Date.now(), expiresAt) }),
      Math.max(0, expiresAt - Date.now())
    )

    // Timers are frozen while the user is in the dialer, so check again as soon
    // as the page is visible.
    let stopVisibilityWatch = () => {}
    if (typeof document !== "undefined") {
      const onVisible = () => {
        if (document.visibilityState === "visible") apply({ type: "tick", now: Date.now() })
      }
      document.addEventListener("visibilitychange", onVisible)
      stopVisibilityWatch = () => document.removeEventListener("visibilitychange", onVisible)
    }

    active = { attempt, abort, timer, stopVisibilityWatch }
    const payment = store.getState().payment
    if (payment) void run(attempt, payment, abort.signal)
  }

  async function run(attempt: number, payment: StartedPayment, signal: AbortSignal) {
    const succeed = (reference: string) =>
      apply({
        type: "approved",
        attempt,
        receipt: { ...receiptBase(payment), reference, paidAt: Date.now() },
      })
    const fail = (reason?: string) => apply({ type: "declined", attempt, reason })

    let result: PayResult
    try {
      result = await options.onPay({ ...payment, attempt, signal })
    } catch (error) {
      if (!signal.aborted) fail(errorMessage(error))
      return
    }
    if (signal.aborted) return

    if (result.status === "success") return succeed(result.reference)
    if (result.status === "failed") return fail(result.reason)

    apply({
      type: "reference",
      attempt,
      reference: result.reference,
      ussdCode: result.ussdCode,
    })
    if (!options.onCheckStatus) return // Nothing to poll: wait for the timeout.

    let errors = 0
    while (!signal.aborted) {
      await sleep(options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS, signal)
      if (signal.aborted) return
      // Read on every check, so a callback that changes mid-payment is picked up.
      const check = options.onCheckStatus
      if (!check) continue
      try {
        const status = await check(result.reference, { attempt, signal })
        if (signal.aborted) return
        errors = 0
        if (status.status === "success") return succeed(status.reference ?? result.reference)
        if (status.status === "failed") return fail(status.reason)
      } catch (error) {
        if (signal.aborted) return
        // A dropped connection should not fail a payment the user may have approved.
        if (++errors >= MAX_STATUS_ERRORS) return fail(errorMessage(error))
      }
    }
  }

  return {
    getSnapshot: store.getState,
    subscribe: store.subscribe,
    setOptions(next) {
      options = { ...options, ...next }
    },
    pay(input) {
      if (store.getState().state.status !== "idle") return
      // Fix the amount now: the customer approves this amount, whatever the page does next.
      const payment: StartedPayment = {
        ...input,
        amount: options.amount,
        currency: options.currency,
      }
      apply(
        { type: "submit", now: Date.now(), timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS },
        payment
      )
    },
    retry: () => apply({ type: "retry", now: Date.now() }),
    cancel: () => apply({ type: "cancel" }),
    reset: () => apply({ type: "reset" }),
    destroy() {
      // Stop the work, and go back to idle so the controller can be used again
      // (React's strict mode mounts, unmounts and mounts a component once).
      stopAttempt()
      const { state, payment } = store.getState()
      if (state.status !== "idle")
        store.setState({ state: { status: "idle", attempt: state.attempt }, payment })
    },
  }
}

function receiptBase(payment: StartedPayment): Omit<PaymentReceipt, "reference" | "paidAt"> {
  return {
    amount: payment.amount,
    currency: payment.currency,
    methodId: payment.methodId,
    phone: payment.phone,
  }
}
