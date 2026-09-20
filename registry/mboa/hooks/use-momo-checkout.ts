"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"

import {
  checkoutReducer,
  initialCheckoutState,
  type CheckoutState,
  type PaymentReceipt,
} from "@/lib/mboa/checkout-machine"
import type { CurrencyCode } from "@/lib/mboa/countries/types"

/** What the user chose to pay with. */
export interface PaymentInput {
  /** Id of the payment method, e.g. "mtn", "card" or "cash". */
  methodId: string
  /** E.164 number, for Mobile Money. */
  phone?: string
}

/** A payment as it was when the user pressed Pay. The amount is fixed from that moment. */
export interface StartedPayment extends PaymentInput {
  amount: number
  currency: CurrencyCode
}

export interface PaymentRequest extends PaymentInput {
  amount: number
  currency: CurrencyCode
  /** 1 for the first try, then 2, 3... after each retry. Handy for idempotency keys. */
  attempt: number
  /** Aborted when the user cancels, the request times out or the component unmounts. */
  signal: AbortSignal
}

/** What `onPay` returns. */
export type PayResult =
  /** Paid already, for example a backend that waits for approval, or cash. */
  | { status: "success"; reference: string }
  /** Started. The hook then polls `onCheckStatus` with this reference. */
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

export interface UseMomoCheckoutOptions {
  amount: number
  currency: CurrencyCode
  /** Starts the payment on your backend. Never called by mboa-ui itself. */
  onPay: (request: PaymentRequest) => Promise<PayResult>
  /** Asks your backend for the result of a pending payment. Called every `pollIntervalMs`. */
  onCheckStatus?: (reference: string, context: StatusContext) => Promise<StatusResult>
  /** How long to wait for approval before timing out. Defaults to 2 minutes. */
  timeoutMs?: number
  /** Time between status checks. Defaults to 3 seconds. */
  pollIntervalMs?: number
}

export interface MomoCheckout {
  state: CheckoutState
  /**
   * The payment in progress, with the amount and currency from when the user
   * pressed Pay. Changing the `amount` option afterwards does not affect it.
   * Null until the first payment starts.
   */
  payment: StartedPayment | null
  /** Starts a payment. Ignored unless the checkout is idle. */
  pay: (input: PaymentInput) => void
  /** Tries again after a failure or timeout, with the same payment details. */
  retry: () => void
  /** Stops waiting and returns to idle. Does not cancel anything on your backend. */
  cancel: () => void
  /** Returns to idle from any state, for example after a receipt or to change method. */
  reset: () => void
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

/**
 * Runs the payment flow: calls your `onPay`, polls `onCheckStatus` while the
 * user approves on their phone, times out, and cleans up. The states are
 * idle, awaiting approval, success, failed and timeout (see checkout-machine).
 *
 * Results that arrive after the user cancelled, retried or timed out are
 * ignored, so a slow response can never change the wrong attempt.
 */
export function useMomoCheckout(options: UseMomoCheckoutOptions): MomoCheckout {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options
  const [state, dispatch] = useReducer(checkoutReducer, initialCheckoutState)

  // Always read the latest callbacks without restarting an attempt in flight.
  const optionsRef = useRef(options)
  const inputRef = useRef<StartedPayment | null>(null)
  const [payment, setPayment] = useState<StartedPayment | null>(null)
  // Set synchronously by pay(), so two clicks in the same tick cannot both get
  // through before React has re-rendered. Cleared once the checkout is idle again.
  const startedRef = useRef(false)
  useEffect(() => {
    optionsRef.current = options
    if (state.status === "idle") startedRef.current = false
  })

  const activeAttempt = state.status === "awaiting_approval" ? state.attempt : 0
  const expiresAt = state.status === "awaiting_approval" ? state.expiresAt : null

  // Run the payment for each new attempt. Leaving the awaiting state (cancel,
  // timeout, result, unmount) aborts it through the cleanup.
  useEffect(() => {
    if (activeAttempt === 0) return
    const controller = new AbortController()
    const { signal } = controller
    const input = inputRef.current
    if (!input) return

    async function run(input: StartedPayment) {
      // The amount and currency are the ones from when the user pressed Pay,
      // not the latest props: the customer approved that amount.
      const { amount, currency } = input
      const { onPay } = optionsRef.current
      const succeed = (reference: string) => {
        const receipt: PaymentReceipt = {
          reference,
          amount,
          currency,
          methodId: input.methodId,
          phone: input.phone,
          paidAt: Date.now(),
        }
        dispatch({ type: "approved", attempt: activeAttempt, receipt })
      }
      const fail = (reason?: string) =>
        dispatch({ type: "declined", attempt: activeAttempt, reason })

      let result: PayResult
      try {
        result = await onPay({ ...input, amount, currency, attempt: activeAttempt, signal })
      } catch (error) {
        if (!signal.aborted) fail(errorMessage(error))
        return
      }
      if (signal.aborted) return

      if (result.status === "success") return succeed(result.reference)
      if (result.status === "failed") return fail(result.reason)

      dispatch({
        type: "reference",
        attempt: activeAttempt,
        reference: result.reference,
        ussdCode: result.ussdCode,
      })
      if (!optionsRef.current.onCheckStatus) return // Nothing to poll: wait for the timeout.

      let errors = 0
      while (!signal.aborted) {
        await sleep(optionsRef.current.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS, signal)
        if (signal.aborted) return
        // Read on every check, so a callback that changes mid-payment is picked up.
        const onCheckStatus = optionsRef.current.onCheckStatus
        if (!onCheckStatus) continue
        try {
          const status = await onCheckStatus(result.reference, { attempt: activeAttempt, signal })
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

    void run(input)
    return () => controller.abort()
  }, [activeAttempt])

  // Time out when the deadline passes, and re-check when the tab becomes
  // visible again (timers are frozen while the user is in the dialer).
  useEffect(() => {
    if (expiresAt === null) return
    const deadline = expiresAt
    const timer = setTimeout(
      () => dispatch({ type: "tick", now: Math.max(Date.now(), deadline) }),
      Math.max(0, deadline - Date.now())
    )
    function onVisibilityChange() {
      if (document.visibilityState === "visible") dispatch({ type: "tick", now: Date.now() })
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [expiresAt])

  const pay = useCallback(
    (input: PaymentInput) => {
      if (startedRef.current) return
      startedRef.current = true
      const { amount, currency } = optionsRef.current
      const started: StartedPayment = { ...input, amount, currency }
      inputRef.current = started
      setPayment(started)
      dispatch({ type: "submit", now: Date.now(), timeoutMs })
    },
    [timeoutMs]
  )
  const retry = useCallback(() => dispatch({ type: "retry", now: Date.now() }), [])
  const cancel = useCallback(() => dispatch({ type: "cancel" }), [])
  const reset = useCallback(() => dispatch({ type: "reset" }), [])

  return { state, payment, pay, retry, cancel, reset }
}
