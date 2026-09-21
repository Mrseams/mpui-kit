import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  MAX_STATUS_ERRORS,
  createCheckoutController,
  type CheckoutOptions,
  type PayResult,
} from "@/lib/mboa/core/checkout-controller"

// This file runs in Node, with no DOM and no React: the controller must not need either.

const START = new Date("2026-01-01T12:00:00Z").getTime()
const INPUT = { methodId: "mtn", phone: "+237651234567" }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
})

const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms)

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

type PayFn = CheckoutOptions["onPay"]
type StatusFn = NonNullable<CheckoutOptions["onCheckStatus"]>

const pending = (reference = "R1", ussdCode?: string): PayResult => ({
  status: "pending",
  reference,
  ussdCode,
})

function setup(onPay: PayFn, onCheckStatus?: StatusFn, extra: Partial<CheckoutOptions> = {}) {
  return createCheckoutController({
    amount: 25000,
    currency: "XAF",
    onPay,
    onCheckStatus,
    pollIntervalMs: 1_000,
    ...extra,
  })
}

const status = (checkout: ReturnType<typeof setup>) => checkout.getSnapshot().state.status

describe("running without a DOM", () => {
  it("has no document or window, and still works", async () => {
    expect(typeof document).toBe("undefined")
    expect(typeof window).toBe("undefined")

    const checkout = setup(vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "P" }))
    checkout.pay(INPUT)
    await advance(0)
    expect(status(checkout)).toBe("success")
  })
})

describe("subscribing", () => {
  it("starts idle with no payment", () => {
    const checkout = setup(vi.fn<PayFn>())
    expect(checkout.getSnapshot()).toEqual({ state: { status: "idle", attempt: 0 }, payment: null })
  })

  it("returns the same snapshot object until something changes", async () => {
    const checkout = setup(vi.fn<PayFn>().mockResolvedValue(pending()))
    expect(checkout.getSnapshot()).toBe(checkout.getSnapshot())

    const before = checkout.getSnapshot()
    checkout.pay(INPUT)
    expect(checkout.getSnapshot()).not.toBe(before)
    expect(checkout.getSnapshot()).toBe(checkout.getSnapshot())
  })

  it("notifies on each change and stops after unsubscribe", async () => {
    const checkout = setup(vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "P" }))
    const listener = vi.fn()
    const stop = checkout.subscribe(listener)

    checkout.pay(INPUT)
    await advance(0)
    // idle -> awaiting, then awaiting -> success
    expect(listener).toHaveBeenCalledTimes(2)

    stop()
    checkout.reset()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("lets a listener read the new state", async () => {
    const checkout = setup(vi.fn<PayFn>().mockResolvedValue(pending()))
    const seen: string[] = []
    checkout.subscribe(() => seen.push(status(checkout)))
    checkout.pay(INPUT)
    await advance(0)
    expect(seen[0]).toBe("awaiting_approval")
  })
})

describe("paying", () => {
  it("goes to awaiting approval and calls onPay once, with the request", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const checkout = setup(onPay)
    checkout.pay(INPUT)
    await advance(0)

    expect(status(checkout)).toBe("awaiting_approval")
    expect(onPay).toHaveBeenCalledTimes(1)
    expect(onPay.mock.calls[0][0]).toMatchObject({
      ...INPUT,
      amount: 25000,
      currency: "XAF",
      attempt: 1,
    })
    expect(onPay.mock.calls[0][0].signal.aborted).toBe(false)
  })

  it("ignores a second pay in the same tick, so a double click cannot change the payment", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const checkout = setup(onPay)
    checkout.pay(INPUT)
    checkout.pay({ methodId: "orange", phone: "+237655123456" })
    await advance(0)

    expect(onPay).toHaveBeenCalledTimes(1)
    expect(onPay.mock.calls[0][0].methodId).toBe("mtn")
  })

  it("passes an opaque payload from the payment method through to onPay", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "P" })
    const checkout = setup(onPay)
    const payload = { confirmationToken: "ctoken_123" }
    checkout.pay({ methodId: "card", payload })
    await advance(0)

    expect(onPay.mock.calls[0][0].payload).toBe(payload)
    expect(checkout.getSnapshot().payment).toMatchObject({ methodId: "card", payload })
  })

  it("does not put the payload in the receipt", async () => {
    const checkout = setup(vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "P" }))
    checkout.pay({ methodId: "card", payload: { token: "secret" } })
    await advance(0)

    const state = checkout.getSnapshot().state
    expect(state.status === "success" && state.receipt).not.toHaveProperty("payload")
  })

  it("succeeds with a receipt when onPay reports success", async () => {
    const checkout = setup(
      vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "PAY-1" })
    )
    checkout.pay(INPUT)
    await advance(0)

    expect(checkout.getSnapshot().state).toEqual({
      status: "success",
      attempt: 1,
      receipt: {
        reference: "PAY-1",
        amount: 25000,
        currency: "XAF",
        methodId: "mtn",
        phone: "+237651234567",
        paidAt: START,
      },
    })
  })

  it("fails with the reason, or the message of a thrown error", async () => {
    const failed = setup(vi.fn<PayFn>().mockResolvedValue({ status: "failed", reason: "nope" }))
    failed.pay(INPUT)
    await advance(0)
    expect(failed.getSnapshot().state).toMatchObject({ status: "failed", reason: "nope" })

    const thrown = setup(vi.fn<PayFn>().mockRejectedValue(new Error("gateway down")))
    thrown.pay(INPUT)
    await advance(0)
    expect(thrown.getSnapshot().state).toMatchObject({ status: "failed", reason: "gateway down" })
  })
})

describe("polling", () => {
  it("checks the status every interval until it succeeds, then stops", async () => {
    const onCheckStatus = vi
      .fn<StatusFn>()
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "success" })
    const checkout = setup(vi.fn<PayFn>().mockResolvedValue(pending("R1")), onCheckStatus)

    checkout.pay(INPUT)
    await advance(0)
    expect(onCheckStatus).not.toHaveBeenCalled()

    await advance(3_000)
    expect(status(checkout)).toBe("success")
    expect(onCheckStatus.mock.calls[0][0]).toBe("R1")

    await advance(10_000)
    expect(onCheckStatus).toHaveBeenCalledTimes(3)
  })

  it("tolerates a few dropped connections but not too many", async () => {
    const flaky = vi
      .fn<StatusFn>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ status: "success" })
    const survives = setup(vi.fn<PayFn>().mockResolvedValue(pending()), flaky)
    survives.pay(INPUT)
    await advance(3_000)
    expect(status(survives)).toBe("success")

    const dead = setup(
      vi.fn<PayFn>().mockResolvedValue(pending()),
      vi.fn<StatusFn>().mockRejectedValue(new Error("network down"))
    )
    dead.pay(INPUT)
    await advance(MAX_STATUS_ERRORS * 1_000)
    expect(dead.getSnapshot().state).toMatchObject({ status: "failed", reason: "network down" })
  })

  it("picks up a new onCheckStatus handed over mid-payment", async () => {
    const first = vi.fn<StatusFn>().mockResolvedValue({ status: "pending" })
    const second = vi.fn<StatusFn>().mockResolvedValue({ status: "success" })
    const checkout = setup(vi.fn<PayFn>().mockResolvedValue(pending()), first)
    checkout.pay(INPUT)
    await advance(0)

    checkout.setOptions({ onCheckStatus: second })
    await advance(1_000)
    expect(first).not.toHaveBeenCalled()
    expect(status(checkout)).toBe("success")
  })
})

describe("timeout", () => {
  it("times out at the deadline and stops polling", async () => {
    const onCheckStatus = vi.fn<StatusFn>().mockResolvedValue({ status: "pending" })
    const checkout = setup(vi.fn<PayFn>().mockResolvedValue(pending()), onCheckStatus, {
      timeoutMs: 10_000,
    })
    checkout.pay(INPUT)
    await advance(10_000)
    expect(status(checkout)).toBe("timeout")

    const calls = onCheckStatus.mock.calls.length
    await advance(60_000)
    expect(onCheckStatus).toHaveBeenCalledTimes(calls)
  })

  it("aborts the request when it times out, and ignores a late approval", async () => {
    const slow = deferred<PayResult>()
    const onPay = vi.fn<PayFn>().mockReturnValue(slow.promise)
    const checkout = setup(onPay, undefined, { timeoutMs: 5_000 })
    checkout.pay(INPUT)
    await advance(5_000)
    expect(onPay.mock.calls[0][0].signal.aborted).toBe(true)

    slow.resolve({ status: "success", reference: "LATE" })
    await advance(0)
    expect(status(checkout)).toBe("timeout")
  })
})

describe("cancel, retry, reset", () => {
  it("cancel returns to idle, aborts, and ignores a late answer", async () => {
    const slow = deferred<PayResult>()
    const onPay = vi.fn<PayFn>().mockReturnValue(slow.promise)
    const checkout = setup(onPay)
    checkout.pay(INPUT)
    await advance(0)

    checkout.cancel()
    expect(status(checkout)).toBe("idle")
    expect(onPay.mock.calls[0][0].signal.aborted).toBe(true)

    slow.resolve({ status: "success", reference: "LATE" })
    await advance(0)
    expect(status(checkout)).toBe("idle")
  })

  it("retry pays again with the same details and a new attempt", async () => {
    const onPay = vi
      .fn<PayFn>()
      .mockResolvedValueOnce({ status: "failed" })
      .mockResolvedValueOnce(pending("R2"))
    const checkout = setup(onPay)
    checkout.pay({ ...INPUT, payload: "keep me" })
    await advance(0)
    checkout.retry()
    await advance(0)

    expect(onPay).toHaveBeenCalledTimes(2)
    expect(onPay.mock.calls[1][0]).toMatchObject({ ...INPUT, payload: "keep me", attempt: 2 })
    expect(checkout.getSnapshot().state).toMatchObject({ attempt: 2, reference: "R2" })
  })

  it("ignores a late result from an earlier attempt after a retry", async () => {
    const first = deferred<PayResult>()
    const onPay = vi
      .fn<PayFn>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(pending("R2"))
    const checkout = setup(onPay, undefined, { timeoutMs: 5_000 })
    checkout.pay(INPUT)
    await advance(5_000)
    checkout.retry()
    await advance(0)

    first.resolve({ status: "success", reference: "STALE" })
    await advance(0)
    expect(checkout.getSnapshot().state).toMatchObject({ status: "awaiting_approval", attempt: 2 })
  })

  it("reset returns to idle so another payment can start", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "P" })
    const checkout = setup(onPay)
    checkout.pay(INPUT)
    await advance(0)
    checkout.reset()
    expect(status(checkout)).toBe("idle")

    checkout.pay({ methodId: "cash" })
    await advance(0)
    expect(onPay.mock.calls[1][0]).toMatchObject({ methodId: "cash", attempt: 2 })
  })
})

describe("the amount is fixed when the user presses Pay", () => {
  it("keeps the original amount for the payment and a retry, and takes a new one for the next payment", async () => {
    const onPay = vi
      .fn<PayFn>()
      .mockResolvedValueOnce({ status: "failed" })
      .mockResolvedValueOnce({ status: "failed" })
      .mockResolvedValueOnce({ status: "success", reference: "PAY-3" })
    const checkout = setup(onPay)

    checkout.pay(INPUT)
    await advance(0)
    checkout.setOptions({ amount: 40000, currency: "XOF" })
    checkout.retry()
    await advance(0)
    expect(onPay.mock.calls[1][0]).toMatchObject({ amount: 25000, currency: "XAF" })
    expect(checkout.getSnapshot().payment).toMatchObject({ amount: 25000, currency: "XAF" })

    checkout.reset()
    checkout.pay(INPUT)
    await advance(0)
    expect(onPay.mock.calls[2][0]).toMatchObject({ amount: 40000, currency: "XOF" })
  })
})

describe("destroy", () => {
  it("stops every timer and aborts the request", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const onCheckStatus = vi.fn<StatusFn>().mockResolvedValue({ status: "pending" })
    const checkout = setup(onPay, onCheckStatus)
    checkout.pay(INPUT)
    await advance(1_500)
    const calls = onCheckStatus.mock.calls.length

    checkout.destroy()
    expect(onPay.mock.calls[0][0].signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)

    await advance(60_000)
    expect(onCheckStatus).toHaveBeenCalledTimes(calls)
  })

  it("leaves the controller usable, so a strict-mode remount does not break it", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "P" })
    const checkout = setup(onPay)
    checkout.destroy()
    checkout.pay(INPUT)
    await advance(0)
    expect(status(checkout)).toBe("success")
  })

  it("goes back to idle", async () => {
    const checkout = setup(vi.fn<PayFn>().mockResolvedValue(pending()))
    checkout.pay(INPUT)
    await advance(0)
    checkout.destroy()
    expect(status(checkout)).toBe("idle")
  })
})
