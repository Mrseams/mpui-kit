import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createDemoBackend, type DemoScenario } from "@/lib/demo-backend"
import type { PaymentRequest } from "@/hooks/mboa/use-momo-checkout"

const request = (methodId: string, signal = new AbortController().signal): PaymentRequest => ({
  methodId,
  phone: "+237651234567",
  amount: 25000,
  currency: "XAF",
  attempt: 1,
  signal,
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function setup(scenario: DemoScenario) {
  const backend = createDemoBackend({ scenario, approveAfterMs: 5_000 })
  return { ...backend, set: backend.setScenario }
}

describe("createDemoBackend", () => {
  it("settles card and cash straight away", async () => {
    const { onPay } = setup("approve")
    const promise = onPay(request("cash"))
    await vi.advanceTimersByTimeAsync(600)
    await expect(promise).resolves.toEqual({ status: "success", reference: "DEMO-0001" })
  })

  it("starts Mobile Money as pending with a made-up USSD code", async () => {
    const { onPay } = setup("approve")
    const promise = onPay(request("mtn"))
    await vi.advanceTimersByTimeAsync(600)
    await expect(promise).resolves.toEqual({
      status: "pending",
      reference: "DEMO-0001",
      ussdCode: "*123#",
    })
  })

  it("numbers each payment", async () => {
    const { onPay } = setup("approve")
    const first = onPay(request("mtn"))
    const second = onPay(request("mtn"))
    await vi.advanceTimersByTimeAsync(600)
    expect(await first).toMatchObject({ reference: "DEMO-0001" })
    expect(await second).toMatchObject({ reference: "DEMO-0002" })
  })

  it("approves after the fake user has had time, in the approve scenario", async () => {
    const { onPay, onCheckStatus } = setup("approve")
    const pay = onPay(request("mtn"))
    await vi.advanceTimersByTimeAsync(600)
    await pay

    const early = onCheckStatus("DEMO-0001")
    await vi.advanceTimersByTimeAsync(300)
    await expect(early).resolves.toEqual({ status: "pending" })

    await vi.advanceTimersByTimeAsync(5_000)
    const late = onCheckStatus("DEMO-0001")
    await vi.advanceTimersByTimeAsync(300)
    await expect(late).resolves.toEqual({ status: "success" })
  })

  it("declines after the delay in the decline scenario", async () => {
    const { onPay, onCheckStatus } = setup("decline")
    const pay = onPay(request("mtn"))
    await vi.advanceTimersByTimeAsync(600)
    await pay
    await vi.advanceTimersByTimeAsync(5_000)

    const check = onCheckStatus("DEMO-0001")
    await vi.advanceTimersByTimeAsync(300)
    await expect(check).resolves.toEqual({ status: "failed", reason: "declined_by_user" })
  })

  it("never answers in the timeout scenario", async () => {
    const { onPay, onCheckStatus } = setup("timeout")
    const pay = onPay(request("mtn"))
    await vi.advanceTimersByTimeAsync(600)
    await pay
    await vi.advanceTimersByTimeAsync(600_000)

    const check = onCheckStatus("DEMO-0001")
    await vi.advanceTimersByTimeAsync(300)
    await expect(check).resolves.toEqual({ status: "pending" })
  })

  it("throws in the error scenario, but still settles card and cash", async () => {
    const { onPay } = setup("error")
    const mobile = onPay(request("mtn"))
    const rejected = expect(mobile).rejects.toThrow("Demo gateway error")
    await vi.advanceTimersByTimeAsync(600)
    await rejected

    const cash = onPay(request("cash"))
    await vi.advanceTimersByTimeAsync(600)
    await expect(cash).resolves.toMatchObject({ status: "success" })
  })

  it("follows a scenario that changes while it is running", async () => {
    const { onPay, onCheckStatus, set } = setup("approve")
    const pay = onPay(request("mtn"))
    await vi.advanceTimersByTimeAsync(600)
    await pay
    set("decline")
    await vi.advanceTimersByTimeAsync(5_000)

    const check = onCheckStatus("DEMO-0001")
    await vi.advanceTimersByTimeAsync(300)
    await expect(check).resolves.toMatchObject({ status: "failed" })
  })

  it("stops waiting when the request is aborted", async () => {
    const { onPay } = setup("approve")
    const controller = new AbortController()
    const promise = onPay(request("mtn", controller.signal))
    controller.abort()
    await expect(promise).resolves.toMatchObject({ status: "pending" })
  })
})
