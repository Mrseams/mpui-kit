import type { PayResult, StatusResult, PaymentRequest } from "@/hooks/mpkit/use-momo-checkout"

/**
 * A fake payment backend for the docs demos. It makes no network calls: it
 * waits a moment and answers according to a scenario, so you can see every
 * state of the checkout.
 */
export type DemoScenario = "approve" | "decline" | "timeout" | "error"

export interface DemoBackendOptions {
  /** The scenario to start with. Change it later with `setScenario`. */
  scenario?: DemoScenario
  /** How long the fake user takes to approve or decline on their phone. Default 5 s. */
  approveAfterMs?: number
  /** Latency of each fake request. Default 600 ms. */
  latencyMs?: number
}

/** Resolves after `ms`, or as soon as `signal` aborts. */
function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve()
    const timer = setTimeout(done, ms)
    function done() {
      clearTimeout(timer)
      signal?.removeEventListener("abort", done)
      resolve()
    }
    signal?.addEventListener("abort", done)
  })
}

export function createDemoBackend({
  scenario: initialScenario = "approve",
  approveAfterMs = 5_000,
  latencyMs = 600,
}: DemoBackendOptions = {}) {
  let scenario = initialScenario
  let counter = 0
  const startedAt = new Map<string, number>()

  async function onPay(request: PaymentRequest): Promise<PayResult> {
    await wait(latencyMs, request.signal)
    const reference = `DEMO-${String(++counter).padStart(4, "0")}`

    // Card, cash and anything with a payload (a token from a method panel) settle straight away in the demo.
    if (
      request.methodId === "card" ||
      request.methodId === "cash" ||
      request.payload !== undefined
    ) {
      return { status: "success", reference }
    }

    if (scenario === "error") throw new Error("Demo gateway error")

    startedAt.set(reference, Date.now())
    // *123# is a made-up code, not a real operator's.
    return { status: "pending", reference, ussdCode: "*123#" }
  }

  async function onCheckStatus(reference: string): Promise<StatusResult> {
    await wait(Math.min(latencyMs, 300))
    const started = startedAt.get(reference) ?? Date.now()
    const answered = Date.now() - started >= approveAfterMs

    switch (scenario) {
      case "approve":
        return answered ? { status: "success" } : { status: "pending" }
      case "decline":
        return answered ? { status: "failed", reason: "declined_by_user" } : { status: "pending" }
      case "error":
        throw new Error("Demo gateway error")
      case "timeout":
        return { status: "pending" }
    }
  }

  /** Changes what happens from now on, including for a payment already waiting. */
  function setScenario(next: DemoScenario) {
    scenario = next
  }

  return { onPay, onCheckStatus, setScenario }
}
