import type { CurrencyCode } from "@/registry/countries/types"

export interface PaymentReceipt {
  reference: string
  amount: number
  currency: CurrencyCode
  /** Id of the payment method used, e.g. "mtn", "card", "cash". */
  methodId: string
  /** E.164 number, for Mobile Money payments. */
  phone?: string
  /** Unix time in milliseconds. */
  paidAt: number
}

/**
 * Every state carries `attempt`, a counter that only ever goes up (it survives
 * cancel and reset). Async results are tagged with the attempt that started
 * them, so a late response from an abandoned attempt can never move a newer one.
 */
export type CheckoutState =
  | { status: "idle"; attempt: number }
  | {
      status: "awaiting_approval"
      attempt: number
      /** Unix ms when this attempt started. */
      startedAt: number
      /** Unix ms after which the attempt times out. */
      expiresAt: number
      timeoutMs: number
      /** Set once the backend has created the payment. */
      reference?: string
      /** USSD code to show as a fallback if the phone prompt does not arrive. */
      ussdCode?: string
    }
  | { status: "success"; attempt: number; receipt: PaymentReceipt }
  | { status: "failed"; attempt: number; timeoutMs: number; reason?: string }
  | { status: "timeout"; attempt: number; timeoutMs: number }

export type CheckoutStatus = CheckoutState["status"]

export type CheckoutEvent =
  /** User confirms the payment. Only valid from idle. */
  | { type: "submit"; now: number; timeoutMs: number }
  /** The backend created the payment. */
  | { type: "reference"; attempt: number; reference: string; ussdCode?: string }
  /** The user approved on their phone. */
  | { type: "approved"; attempt: number; receipt: PaymentReceipt }
  /** The payment was refused or errored. */
  | { type: "declined"; attempt: number; reason?: string }
  /** Clock tick. Moves awaiting_approval to timeout once expired. */
  | { type: "tick"; now: number }
  /** Start a new attempt after failed or timeout, reusing the same timeout. */
  | { type: "retry"; now: number }
  /** Abandon the current attempt and go back to idle. */
  | { type: "cancel" }
  /** Return to idle from any state, e.g. "change payment method" or "done". */
  | { type: "reset" }

export const initialCheckoutState: CheckoutState = { status: "idle", attempt: 0 }

function begin(attempt: number, now: number, timeoutMs: number): CheckoutState {
  return {
    status: "awaiting_approval",
    attempt,
    startedAt: now,
    expiresAt: now + timeoutMs,
    timeoutMs,
  }
}

/**
 * Pure reducer for the payment flow:
 *
 *   idle -> awaiting_approval -> success | failed | timeout
 *   failed | timeout -> (retry) -> awaiting_approval
 *   awaiting_approval -> (cancel) -> idle
 *
 * Events that do not apply to the current state, or that belong to an older
 * attempt, are ignored and return the same state object.
 *
 * An approval that arrives after the timeout is ignored. The UI should tell
 * users that a late approval on their phone is not confirmed here.
 */
export function checkoutReducer(state: CheckoutState, event: CheckoutEvent): CheckoutState {
  switch (event.type) {
    case "submit":
      return state.status === "idle" ? begin(state.attempt + 1, event.now, event.timeoutMs) : state

    case "retry":
      return state.status === "failed" || state.status === "timeout"
        ? begin(state.attempt + 1, event.now, state.timeoutMs)
        : state

    case "reference":
      return state.status === "awaiting_approval" && event.attempt === state.attempt
        ? { ...state, reference: event.reference, ussdCode: event.ussdCode ?? state.ussdCode }
        : state

    case "approved":
      return state.status === "awaiting_approval" && event.attempt === state.attempt
        ? { status: "success", attempt: state.attempt, receipt: event.receipt }
        : state

    case "declined":
      return state.status === "awaiting_approval" && event.attempt === state.attempt
        ? {
            status: "failed",
            attempt: state.attempt,
            timeoutMs: state.timeoutMs,
            reason: event.reason,
          }
        : state

    case "tick":
      return state.status === "awaiting_approval" && event.now >= state.expiresAt
        ? { status: "timeout", attempt: state.attempt, timeoutMs: state.timeoutMs }
        : state

    case "cancel":
      return state.status === "awaiting_approval"
        ? { status: "idle", attempt: state.attempt }
        : state

    case "reset":
      return state.status === "idle" ? state : { status: "idle", attempt: state.attempt }
  }
}

/** Milliseconds left before timeout. 0 outside awaiting_approval. */
export function remainingMs(state: CheckoutState, now: number): number {
  return state.status === "awaiting_approval" ? Math.max(0, state.expiresAt - now) : 0
}

/** True while a payment is in flight and the form should be locked. */
export function isPending(state: CheckoutState): boolean {
  return state.status === "awaiting_approval"
}

/** True once the flow has reached a final result for the current attempt. */
export function isSettled(state: CheckoutState): boolean {
  return state.status === "success" || state.status === "failed" || state.status === "timeout"
}
