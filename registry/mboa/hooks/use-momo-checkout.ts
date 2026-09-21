"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import {
  createCheckoutController,
  type CheckoutController,
  type CheckoutOptions,
} from "@/lib/mboa/core/checkout-controller"
import type { CheckoutState } from "@/lib/mboa/checkout-machine"

// The payment flow lives in the framework-free core. These names stay
// importable from here, so code written against the hook keeps working.
export {
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  MAX_STATUS_ERRORS,
} from "@/lib/mboa/core/checkout-controller"
export type {
  PayResult,
  PaymentInput,
  PaymentRequest,
  StartedPayment,
  StatusContext,
  StatusResult,
} from "@/lib/mboa/core/checkout-controller"

export type UseMomoCheckoutOptions = CheckoutOptions

export interface MomoCheckout {
  state: CheckoutState
  /**
   * The payment in progress, with the amount and currency from when the user
   * pressed Pay. Changing the `amount` option afterwards does not affect it.
   * Null until the first payment starts.
   */
  payment: ReturnType<CheckoutController["getSnapshot"]>["payment"]
  /** Starts a payment. Ignored unless the checkout is idle. */
  pay: CheckoutController["pay"]
  /** Tries again after a failure or timeout, with the same payment details. */
  retry: CheckoutController["retry"]
  /** Stops waiting and returns to idle. Does not cancel anything on your backend. */
  cancel: CheckoutController["cancel"]
  /** Returns to idle from any state, for example after a receipt or to change method. */
  reset: CheckoutController["reset"]
}

/**
 * The payment flow as a React hook: a thin layer over `createCheckoutController`.
 * Use the controller directly from Vue, Svelte or plain JavaScript.
 */
export function useMomoCheckout(options: UseMomoCheckoutOptions): MomoCheckout {
  const [controller] = useState(() => createCheckoutController(options))

  // Hand over the latest callbacks and amount after every render.
  useEffect(() => {
    controller.setOptions(options)
  })
  useEffect(() => () => controller.destroy(), [controller])

  const { state, payment } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  )

  return {
    state,
    payment,
    pay: controller.pay,
    retry: controller.retry,
    cancel: controller.cancel,
    reset: controller.reset,
  }
}
