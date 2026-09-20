// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  MAX_STATUS_ERRORS,
  useMomoCheckout,
  type PayResult,
  type PaymentRequest,
  type StatusResult,
  type UseMomoCheckoutOptions,
} from "@/hooks/mboa/use-momo-checkout"

const START = new Date("2026-01-01T12:00:00Z").getTime()
const INPUT = { methodId: "mtn", phone: "+237651234567" }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
})

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })

/** A promise you resolve by hand, to control exactly when a backend call answers. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

type PayFn = UseMomoCheckoutOptions["onPay"]
type StatusFn = NonNullable<UseMomoCheckoutOptions["onCheckStatus"]>

function setup(
  onPay: PayFn,
  onCheckStatus?: StatusFn,
  extra: Partial<UseMomoCheckoutOptions> = {}
) {
  return renderHook(
    (props: Partial<UseMomoCheckoutOptions>) =>
      useMomoCheckout({
        amount: 25000,
        currency: "XAF",
        onPay,
        onCheckStatus,
        pollIntervalMs: 1_000,
        ...extra,
        ...props,
      }),
    { initialProps: {} as Partial<UseMomoCheckoutOptions> }
  )
}

const pending = (reference = "R1", ussdCode?: string): PayResult => ({
  status: "pending",
  reference,
  ussdCode,
})

describe("starting a payment", () => {
  it("goes from idle to awaiting approval and calls onPay once", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const { result } = setup(onPay)
    expect(result.current.state.status).toBe("idle")

    act(() => result.current.pay(INPUT))
    await advance(0)

    expect(result.current.state.status).toBe("awaiting_approval")
    expect(onPay).toHaveBeenCalledTimes(1)
    const request: PaymentRequest = onPay.mock.calls[0][0]
    expect(request).toMatchObject({
      amount: 25000,
      currency: "XAF",
      methodId: "mtn",
      phone: "+237651234567",
      attempt: 1,
    })
    expect(request.signal).toBeInstanceOf(AbortSignal)
    expect(request.signal.aborted).toBe(false)
  })

  it("sets the deadline from the timeout", async () => {
    const { result } = setup(vi.fn<PayFn>().mockResolvedValue(pending()), undefined, {
      timeoutMs: 45_000,
    })
    act(() => result.current.pay(INPUT))
    await advance(0)
    expect(result.current.state).toMatchObject({ expiresAt: START + 45_000, timeoutMs: 45_000 })
  })

  it("ignores a second pay while one is in progress", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const { result } = setup(onPay)
    act(() => {
      result.current.pay(INPUT)
      result.current.pay({ methodId: "orange", phone: "+237655123456" })
    })
    await advance(0)
    expect(onPay).toHaveBeenCalledTimes(1)
    expect(onPay.mock.calls[0][0].methodId).toBe("mtn")
  })
})

describe("results from onPay", () => {
  it("succeeds straight away when onPay reports success, with a receipt", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "PAY-1" })
    const { result } = setup(onPay)
    act(() => result.current.pay(INPUT))
    await advance(0)

    expect(result.current.state).toEqual({
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

  it("fails with the reason from onPay", async () => {
    const onPay = vi
      .fn<PayFn>()
      .mockResolvedValue({ status: "failed", reason: "insufficient_funds" })
    const { result } = setup(onPay)
    act(() => result.current.pay(INPUT))
    await advance(0)
    expect(result.current.state).toMatchObject({ status: "failed", reason: "insufficient_funds" })
  })

  it("fails with the error message when onPay throws", async () => {
    const onPay = vi.fn<PayFn>().mockRejectedValue(new Error("gateway unreachable"))
    const { result } = setup(onPay)
    act(() => result.current.pay(INPUT))
    await advance(0)
    expect(result.current.state).toMatchObject({ status: "failed", reason: "gateway unreachable" })
  })

  it("fails without a reason when something other than an Error is thrown", async () => {
    const onPay = vi.fn<PayFn>().mockRejectedValue("nope")
    const { result } = setup(onPay)
    act(() => result.current.pay(INPUT))
    await advance(0)
    expect(result.current.state).toMatchObject({ status: "failed", reason: undefined })
  })

  it("stores the reference and USSD code from a pending result", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending("R7", "*123#"))
    const { result } = setup(onPay)
    act(() => result.current.pay(INPUT))
    await advance(0)
    expect(result.current.state).toMatchObject({
      status: "awaiting_approval",
      reference: "R7",
      ussdCode: "*123#",
    })
  })
})

describe("polling for approval", () => {
  it("checks the status every interval until it succeeds", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending("R1"))
    const onCheckStatus = vi
      .fn<StatusFn>()
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "success" })
    const { result } = setup(onPay, onCheckStatus)

    act(() => result.current.pay(INPUT))
    await advance(0)
    expect(onCheckStatus).not.toHaveBeenCalled()

    await advance(1_000)
    expect(onCheckStatus).toHaveBeenCalledTimes(1)
    expect(onCheckStatus.mock.calls[0][0]).toBe("R1")
    expect(result.current.state.status).toBe("awaiting_approval")

    await advance(2_000)
    expect(result.current.state).toMatchObject({
      status: "success",
      receipt: { reference: "R1", methodId: "mtn", amount: 25000 },
    })

    // Polling stops once the payment has settled.
    await advance(10_000)
    expect(onCheckStatus).toHaveBeenCalledTimes(3)
  })

  it("uses the reference from the status result when it has one", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending("R1"))
    const onCheckStatus = vi
      .fn<StatusFn>()
      .mockResolvedValue({ status: "success", reference: "TX-9" })
    const { result } = setup(onPay, onCheckStatus)
    act(() => result.current.pay(INPUT))
    await advance(1_000)
    expect(result.current.state).toMatchObject({
      status: "success",
      receipt: { reference: "TX-9" },
    })
  })

  it("fails when the status check reports a failure", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const onCheckStatus = vi
      .fn<StatusFn>()
      .mockResolvedValue({ status: "failed", reason: "declined_by_user" })
    const { result } = setup(onPay, onCheckStatus)
    act(() => result.current.pay(INPUT))
    await advance(1_000)
    expect(result.current.state).toMatchObject({ status: "failed", reason: "declined_by_user" })
  })

  it("passes the attempt and an abort signal to onCheckStatus", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const onCheckStatus = vi.fn<StatusFn>().mockResolvedValue({ status: "pending" })
    const { result } = setup(onPay, onCheckStatus)
    act(() => result.current.pay(INPUT))
    await advance(1_000)
    const context = onCheckStatus.mock.calls[0][1]
    expect(context.attempt).toBe(1)
    expect(context.signal).toBeInstanceOf(AbortSignal)
  })

  it("tolerates a few dropped connections without failing the payment", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const onCheckStatus = vi
      .fn<StatusFn>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ status: "success" })
    const { result } = setup(onPay, onCheckStatus)
    act(() => result.current.pay(INPUT))
    await advance(3_000)
    expect(result.current.state.status).toBe("success")
  })

  it("resets the error count after a good response", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const responses: Array<StatusResult | Error> = [
      ...Array<Error>(MAX_STATUS_ERRORS - 1).fill(new Error("offline")),
      { status: "pending" },
      ...Array<Error>(MAX_STATUS_ERRORS - 1).fill(new Error("offline")),
      { status: "success" },
    ]
    const onCheckStatus = vi.fn<StatusFn>().mockImplementation(async () => {
      const next = responses.shift()
      if (next instanceof Error) throw next
      return next ?? { status: "pending" }
    })
    const { result } = setup(onPay, onCheckStatus)
    act(() => result.current.pay(INPUT))
    await advance(responses.length * 1_000 + 1_000)
    expect(result.current.state.status).toBe("success")
  })

  it("fails after too many consecutive status errors", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const onCheckStatus = vi.fn<StatusFn>().mockRejectedValue(new Error("network down"))
    const { result } = setup(onPay, onCheckStatus)
    act(() => result.current.pay(INPUT))
    await advance(MAX_STATUS_ERRORS * 1_000)
    expect(result.current.state).toMatchObject({ status: "failed", reason: "network down" })
    expect(onCheckStatus).toHaveBeenCalledTimes(MAX_STATUS_ERRORS)
  })

  it("waits for the timeout when there is no onCheckStatus", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const { result } = setup(onPay, undefined, { timeoutMs: 5_000 })
    act(() => result.current.pay(INPUT))
    await advance(4_000)
    expect(result.current.state.status).toBe("awaiting_approval")
    await advance(1_000)
    expect(result.current.state.status).toBe("timeout")
  })

  it("uses the latest onCheckStatus without restarting the attempt", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const first = vi.fn<StatusFn>().mockResolvedValue({ status: "pending" })
    const second = vi.fn<StatusFn>().mockResolvedValue({ status: "success" })
    const { result, rerender } = setup(onPay, first)
    act(() => result.current.pay(INPUT))
    await advance(0)

    rerender({ onCheckStatus: second })
    await advance(1_000)

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(onPay).toHaveBeenCalledTimes(1)
    expect(result.current.state.status).toBe("success")
  })
})

describe("timeout", () => {
  it("times out when approval does not arrive, and stops polling", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const onCheckStatus = vi.fn<StatusFn>().mockResolvedValue({ status: "pending" })
    const { result } = setup(onPay, onCheckStatus, { timeoutMs: 10_000 })
    act(() => result.current.pay(INPUT))

    await advance(10_000)
    expect(result.current.state.status).toBe("timeout")

    const calls = onCheckStatus.mock.calls.length
    await advance(60_000)
    expect(onCheckStatus).toHaveBeenCalledTimes(calls)
  })

  it("aborts the attempt's signal when it times out", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const { result } = setup(onPay, vi.fn<StatusFn>().mockResolvedValue({ status: "pending" }), {
      timeoutMs: 5_000,
    })
    act(() => result.current.pay(INPUT))
    await advance(5_000)
    expect(onPay.mock.calls[0][0].signal.aborted).toBe(true)
  })

  it("ignores an approval that arrives after the timeout", async () => {
    const slow = deferred<PayResult>()
    const { result } = setup(vi.fn<PayFn>().mockReturnValue(slow.promise), undefined, {
      timeoutMs: 5_000,
    })
    act(() => result.current.pay(INPUT))
    await advance(5_000)
    expect(result.current.state.status).toBe("timeout")

    slow.resolve({ status: "success", reference: "LATE" })
    await advance(0)
    expect(result.current.state.status).toBe("timeout")
  })

  it("re-checks the deadline when the tab becomes visible again", async () => {
    const { result } = setup(vi.fn<PayFn>().mockResolvedValue(pending()), undefined, {
      timeoutMs: 30_000,
    })
    act(() => result.current.pay(INPUT))
    await advance(0)

    // The browser froze timers while the user was in the dialer; the clock kept going.
    vi.setSystemTime(START + 40_000)
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(result.current.state.status).toBe("timeout")
  })
})

describe("cancel, retry and reset", () => {
  it("cancel returns to idle and aborts the request", async () => {
    const slow = deferred<PayResult>()
    const onPay = vi.fn<PayFn>().mockReturnValue(slow.promise)
    const { result } = setup(onPay)
    act(() => result.current.pay(INPUT))
    await advance(0)

    act(() => result.current.cancel())
    expect(result.current.state).toMatchObject({ status: "idle", attempt: 1 })
    expect(onPay.mock.calls[0][0].signal.aborted).toBe(true)

    // A response arriving after cancel changes nothing.
    slow.resolve({ status: "success", reference: "LATE" })
    await advance(0)
    expect(result.current.state.status).toBe("idle")
  })

  it("stops polling after cancel", async () => {
    const onCheckStatus = vi.fn<StatusFn>().mockResolvedValue({ status: "pending" })
    const { result } = setup(vi.fn<PayFn>().mockResolvedValue(pending()), onCheckStatus)
    act(() => result.current.pay(INPUT))
    await advance(2_500)
    const calls = onCheckStatus.mock.calls.length

    act(() => result.current.cancel())
    await advance(10_000)
    expect(onCheckStatus).toHaveBeenCalledTimes(calls)
  })

  it("retry after a failure calls onPay again with the same details and a new attempt", async () => {
    const onPay = vi
      .fn<PayFn>()
      .mockResolvedValueOnce({ status: "failed", reason: "nope" })
      .mockResolvedValueOnce(pending("R2"))
    const { result } = setup(onPay)
    act(() => result.current.pay(INPUT))
    await advance(0)
    expect(result.current.state.status).toBe("failed")

    act(() => result.current.retry())
    await advance(0)

    expect(onPay).toHaveBeenCalledTimes(2)
    expect(onPay.mock.calls[1][0]).toMatchObject({ ...INPUT, amount: 25000, attempt: 2 })
    expect(result.current.state).toMatchObject({
      status: "awaiting_approval",
      attempt: 2,
      reference: "R2",
    })
  })

  it("retry after a timeout starts a fresh countdown", async () => {
    const { result } = setup(vi.fn<PayFn>().mockResolvedValue(pending()), undefined, {
      timeoutMs: 5_000,
    })
    act(() => result.current.pay(INPUT))
    await advance(5_000)
    expect(result.current.state.status).toBe("timeout")

    act(() => result.current.retry())
    await advance(0)
    expect(result.current.state).toMatchObject({
      status: "awaiting_approval",
      expiresAt: Date.now() + 5_000,
    })
  })

  it("ignores a late result from an earlier attempt after a retry", async () => {
    const first = deferred<PayResult>()
    const onPay = vi
      .fn<PayFn>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(pending("R2"))
    const { result } = setup(onPay, undefined, { timeoutMs: 5_000 })

    act(() => result.current.pay(INPUT))
    await advance(5_000)
    act(() => result.current.retry())
    await advance(0)
    expect(result.current.state).toMatchObject({ attempt: 2, reference: "R2" })

    first.resolve({ status: "success", reference: "STALE" })
    await advance(0)
    expect(result.current.state).toMatchObject({ status: "awaiting_approval", attempt: 2 })
  })

  it("reset returns to idle from success so another payment can start", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue({ status: "success", reference: "PAY-1" })
    const { result } = setup(onPay)
    act(() => result.current.pay(INPUT))
    await advance(0)
    expect(result.current.state.status).toBe("success")

    act(() => result.current.reset())
    expect(result.current.state.status).toBe("idle")

    act(() => result.current.pay({ methodId: "cash" }))
    await advance(0)
    expect(onPay).toHaveBeenCalledTimes(2)
    expect(onPay.mock.calls[1][0]).toMatchObject({ methodId: "cash", attempt: 2 })
  })
})

describe("cleanup", () => {
  it("aborts and stops polling when the component unmounts", async () => {
    const onPay = vi.fn<PayFn>().mockResolvedValue(pending())
    const onCheckStatus = vi.fn<StatusFn>().mockResolvedValue({ status: "pending" })
    const { result, unmount } = setup(onPay, onCheckStatus)
    act(() => result.current.pay(INPUT))
    await advance(1_500)
    const calls = onCheckStatus.mock.calls.length

    unmount()
    expect(onPay.mock.calls[0][0].signal.aborted).toBe(true)
    await advance(30_000)
    expect(onCheckStatus).toHaveBeenCalledTimes(calls)
    expect(vi.getTimerCount()).toBe(0)
  })
})
