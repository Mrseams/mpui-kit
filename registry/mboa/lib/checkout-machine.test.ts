import { describe, expect, it } from "vitest"

import {
  checkoutReducer,
  initialCheckoutState,
  isPending,
  isSettled,
  remainingMs,
  type CheckoutEvent,
  type CheckoutState,
  type PaymentReceipt,
} from "@/lib/mboa/checkout-machine"

const T0 = 1_000_000
const TIMEOUT = 120_000

const receipt: PaymentReceipt = {
  reference: "REF-1",
  amount: 25000,
  currency: "XAF",
  methodId: "mtn",
  phone: "+237671234567",
  paidAt: T0 + 10_000,
}

const run = (events: CheckoutEvent[], from: CheckoutState = initialCheckoutState) =>
  events.reduce(checkoutReducer, from)

const submit: CheckoutEvent = { type: "submit", now: T0, timeoutMs: TIMEOUT }

describe("checkoutReducer", () => {
  it("starts idle at attempt 0", () => {
    expect(initialCheckoutState).toEqual({ status: "idle", attempt: 0 })
  })

  it("idle -> awaiting_approval on submit", () => {
    expect(run([submit])).toEqual({
      status: "awaiting_approval",
      attempt: 1,
      startedAt: T0,
      expiresAt: T0 + TIMEOUT,
      timeoutMs: TIMEOUT,
    })
  })

  it("stores the reference and USSD code for the current attempt", () => {
    const state = run([
      submit,
      { type: "reference", attempt: 1, reference: "REF-1", ussdCode: "#150*50#" },
    ])
    expect(state).toMatchObject({
      status: "awaiting_approval",
      reference: "REF-1",
      ussdCode: "#150*50#",
    })
  })

  it("keeps an earlier USSD code when a later reference event has none", () => {
    const state = run([
      submit,
      { type: "reference", attempt: 1, reference: "REF-1", ussdCode: "#150*50#" },
      { type: "reference", attempt: 1, reference: "REF-1" },
    ])
    expect(state).toMatchObject({ ussdCode: "#150*50#" })
  })

  it("awaiting_approval -> success on approval", () => {
    const state = run([submit, { type: "approved", attempt: 1, receipt }])
    expect(state).toEqual({ status: "success", attempt: 1, receipt })
  })

  it("awaiting_approval -> failed on decline, keeping the reason", () => {
    const state = run([submit, { type: "declined", attempt: 1, reason: "insufficient_funds" }])
    expect(state).toEqual({
      status: "failed",
      attempt: 1,
      timeoutMs: TIMEOUT,
      reason: "insufficient_funds",
    })
  })

  describe("timeout", () => {
    it("does not expire before the deadline", () => {
      const awaiting = run([submit])
      expect(checkoutReducer(awaiting, { type: "tick", now: T0 + TIMEOUT - 1 })).toBe(awaiting)
    })

    it("expires exactly at the deadline", () => {
      expect(run([submit, { type: "tick", now: T0 + TIMEOUT }])).toEqual({
        status: "timeout",
        attempt: 1,
        timeoutMs: TIMEOUT,
      })
    })

    it("ignores an approval that arrives after the timeout", () => {
      const timedOut = run([submit, { type: "tick", now: T0 + TIMEOUT }])
      expect(checkoutReducer(timedOut, { type: "approved", attempt: 1, receipt })).toBe(timedOut)
    })
  })

  describe("retry", () => {
    it("failed -> awaiting_approval with a new attempt and the same timeout", () => {
      const failed = run([submit, { type: "declined", attempt: 1 }])
      expect(checkoutReducer(failed, { type: "retry", now: T0 + 5_000 })).toEqual({
        status: "awaiting_approval",
        attempt: 2,
        startedAt: T0 + 5_000,
        expiresAt: T0 + 5_000 + TIMEOUT,
        timeoutMs: TIMEOUT,
      })
    })

    it("timeout -> awaiting_approval with a new attempt", () => {
      const state = run([
        submit,
        { type: "tick", now: T0 + TIMEOUT },
        { type: "retry", now: T0 + TIMEOUT + 1 },
      ])
      expect(state).toMatchObject({ status: "awaiting_approval", attempt: 2 })
    })

    it("is ignored from idle, awaiting_approval and success", () => {
      const idle = initialCheckoutState
      const awaiting = run([submit])
      const success = run([submit, { type: "approved", attempt: 1, receipt }])
      for (const state of [idle, awaiting, success]) {
        expect(checkoutReducer(state, { type: "retry", now: T0 })).toBe(state)
      }
    })
  })

  describe("stale async results", () => {
    it("ignores results from an earlier attempt", () => {
      const secondAttempt = run([
        submit,
        { type: "declined", attempt: 1 },
        { type: "retry", now: T0 + 1 },
      ])
      expect(checkoutReducer(secondAttempt, { type: "approved", attempt: 1, receipt })).toBe(
        secondAttempt
      )
      expect(checkoutReducer(secondAttempt, { type: "declined", attempt: 1 })).toBe(secondAttempt)
      expect(
        checkoutReducer(secondAttempt, { type: "reference", attempt: 1, reference: "OLD" })
      ).toBe(secondAttempt)
    })

    it("ignores a result from a cancelled attempt after a new submit", () => {
      const state = run([
        submit,
        { type: "cancel" },
        { type: "submit", now: T0 + 1, timeoutMs: TIMEOUT },
      ])
      expect(state).toMatchObject({ status: "awaiting_approval", attempt: 2 })
      expect(checkoutReducer(state, { type: "approved", attempt: 1, receipt })).toBe(state)
    })
  })

  describe("cancel and reset", () => {
    it("cancel returns to idle and keeps the attempt counter", () => {
      expect(run([submit, { type: "cancel" }])).toEqual({ status: "idle", attempt: 1 })
    })

    it("cancel is ignored outside awaiting_approval", () => {
      const failed = run([submit, { type: "declined", attempt: 1 }])
      expect(checkoutReducer(failed, { type: "cancel" })).toBe(failed)
    })

    it("reset returns to idle from failed, timeout and success", () => {
      const failed = run([submit, { type: "declined", attempt: 1 }])
      const timeout = run([submit, { type: "tick", now: T0 + TIMEOUT }])
      const success = run([submit, { type: "approved", attempt: 1, receipt }])
      for (const state of [failed, timeout, success]) {
        expect(checkoutReducer(state, { type: "reset" })).toEqual({ status: "idle", attempt: 1 })
      }
    })

    it("reset on idle returns the same state", () => {
      expect(checkoutReducer(initialCheckoutState, { type: "reset" })).toBe(initialCheckoutState)
    })
  })

  describe("invalid transitions", () => {
    it("submit is ignored unless idle", () => {
      const awaiting = run([submit])
      expect(checkoutReducer(awaiting, submit)).toBe(awaiting)
    })

    it("results are ignored while idle", () => {
      const idle = initialCheckoutState
      expect(checkoutReducer(idle, { type: "approved", attempt: 0, receipt })).toBe(idle)
      expect(checkoutReducer(idle, { type: "declined", attempt: 0 })).toBe(idle)
      expect(checkoutReducer(idle, { type: "tick", now: T0 })).toBe(idle)
    })

    it("a success is final until reset", () => {
      const success = run([submit, { type: "approved", attempt: 1, receipt }])
      expect(checkoutReducer(success, { type: "declined", attempt: 1 })).toBe(success)
      expect(checkoutReducer(success, { type: "tick", now: T0 + TIMEOUT })).toBe(success)
    })
  })
})

describe("selectors", () => {
  it("remainingMs counts down and clamps at zero", () => {
    const awaiting = run([submit])
    expect(remainingMs(awaiting, T0)).toBe(TIMEOUT)
    expect(remainingMs(awaiting, T0 + 30_000)).toBe(TIMEOUT - 30_000)
    expect(remainingMs(awaiting, T0 + TIMEOUT + 5_000)).toBe(0)
  })

  it("remainingMs is 0 outside awaiting_approval", () => {
    expect(remainingMs(initialCheckoutState, T0)).toBe(0)
  })

  it("isPending and isSettled describe each status", () => {
    const awaiting = run([submit])
    const success = run([submit, { type: "approved", attempt: 1, receipt }])
    const failed = run([submit, { type: "declined", attempt: 1 }])
    const timeout = run([submit, { type: "tick", now: T0 + TIMEOUT }])

    expect([initialCheckoutState, awaiting, success, failed, timeout].map(isPending)).toEqual([
      false,
      true,
      false,
      false,
      false,
    ])
    expect([initialCheckoutState, awaiting, success, failed, timeout].map(isSettled)).toEqual([
      false,
      false,
      true,
      true,
      true,
    ])
  })
})
