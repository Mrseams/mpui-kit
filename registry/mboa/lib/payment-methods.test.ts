import { describe, expect, it } from "vitest"

import { cm } from "@/lib/mboa/countries/cm"
import {
  defaultPaymentMethods,
  emptySelection,
  resolvePayment,
  type PaymentMethod,
} from "@/lib/mboa/payment-methods"

describe("defaultPaymentMethods", () => {
  it("offers Mobile Money for operators that have a wallet, then card and cash", () => {
    const ids = defaultPaymentMethods(cm).map((method) => method.id)
    // Nexttel and Camtel have no mobileMoneyName in the data.
    expect(ids).toEqual(["mtn", "orange", "card", "cash"])
  })

  it("marks Mobile Money methods with their operator", () => {
    const [mtn] = defaultPaymentMethods(cm)
    expect(mtn).toEqual({ id: "mtn", kind: "mobile_money", operatorId: "mtn" })
  })

  it("can leave out card and cash", () => {
    const kinds = defaultPaymentMethods(cm, { card: false, cash: false }).map((m) => m.kind)
    expect(kinds).toEqual(["mobile_money", "mobile_money"])
  })
})

describe("resolvePayment", () => {
  const methods = defaultPaymentMethods(cm)

  it("is not ready with no selection", () => {
    const result = resolvePayment(emptySelection, methods, cm)
    expect(result).toEqual({ method: null, operator: null, phone: null, e164: null, ready: false })
  })

  it("is not ready for an unknown method id", () => {
    expect(resolvePayment({ methodId: "bitcoin", phone: "" }, methods, cm).ready).toBe(false)
  })

  it("is ready as soon as card or cash is chosen", () => {
    for (const methodId of ["card", "cash"]) {
      const result = resolvePayment({ methodId, phone: "" }, methods, cm)
      expect(result.ready).toBe(true)
      expect(result.e164).toBeNull()
      expect(result.phone).toBeNull()
    }
  })

  it("needs a phone number for Mobile Money", () => {
    const result = resolvePayment({ methodId: "mtn", phone: "" }, methods, cm)
    expect(result.ready).toBe(false)
    expect(result.operator?.id).toBe("mtn")
    expect(result.phone?.issue).toBe("empty")
  })

  it("is not ready for a partial number", () => {
    const result = resolvePayment({ methodId: "mtn", phone: "6512" }, methods, cm)
    expect(result.ready).toBe(false)
    expect(result.phone?.issue).toBe("too_short")
  })

  it("is ready with a valid number of the chosen operator", () => {
    const result = resolvePayment({ methodId: "mtn", phone: "651234567" }, methods, cm)
    expect(result.ready).toBe(true)
    expect(result.e164).toBe("+237651234567")
  })

  it("accepts a number typed in international form", () => {
    const result = resolvePayment({ methodId: "orange", phone: "+237 655 12 34 56" }, methods, cm)
    expect(result.ready).toBe(true)
    expect(result.e164).toBe("+237655123456")
  })

  it("is not ready when the number belongs to a different known operator", () => {
    const result = resolvePayment({ methodId: "mtn", phone: "655123456" }, methods, cm)
    expect(result.ready).toBe(false)
    expect(result.phone?.issue).toBe("operator_mismatch")
    expect(result.e164).toBeNull()
  })

  it("does not block a prefix that is not in the data", () => {
    // Prefix data is unverified and may be incomplete.
    expect(resolvePayment({ methodId: "mtn", phone: "601234567" }, methods, cm).ready).toBe(true)
  })

  it("works with custom methods", () => {
    const custom: PaymentMethod[] = [{ id: "wallet", kind: "mobile_money", operatorId: "orange" }]
    expect(resolvePayment({ methodId: "wallet", phone: "655123456" }, custom, cm).ready).toBe(true)
  })
})
