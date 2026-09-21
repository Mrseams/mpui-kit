import { describe, expect, it } from "vitest"
import { z } from "zod"

import { cm } from "@/lib/mpkit/countries/cm"
import { createPhoneSchema } from "@/lib/mpkit/phone-schema"

const messageOf = (result: { success: boolean; error?: z.ZodError }) =>
  result.error?.issues[0]?.message

describe("createPhoneSchema", () => {
  it("outputs the E.164 number for local and international input", () => {
    const schema = createPhoneSchema(cm)
    expect(schema.parse("6 51 23 45 67")).toBe("+237651234567")
    expect(schema.parse("651234567")).toBe("+237651234567")
    expect(schema.parse("+237 651 234 567")).toBe("+237651234567")
  })

  it("rejects numbers of the wrong length with a translated message", () => {
    const en = createPhoneSchema(cm, { locale: "en" }).safeParse("6512")
    expect(en.success).toBe(false)
    expect(messageOf(en)).toBe("The number is too short. It should have 9 digits.")

    const fr = createPhoneSchema(cm, { locale: "fr" }).safeParse("6512")
    expect(messageOf(fr)).toBe("Le numéro est trop court. Il doit comporter 9 chiffres.")
  })

  it("uses the country's default locale when none is given", () => {
    // Cameroon defaults to French.
    expect(messageOf(createPhoneSchema(cm).safeParse(""))).toBe("Saisissez un numéro de téléphone.")
  })

  it("reports the other problems", () => {
    const schema = createPhoneSchema(cm, { locale: "en" })
    expect(messageOf(schema.safeParse("+33612345678"))).toContain("Cameroon")
    expect(messageOf(schema.safeParse("651abc567"))).toBe("Use digits only.")
    expect(messageOf(schema.safeParse("6512345678"))).toContain("too long")
  })

  it("can require a specific operator", () => {
    const schema = createPhoneSchema(cm, { locale: "en", operator: "mtn" })
    expect(schema.parse("651234567")).toBe("+237651234567")
    const result = schema.safeParse("655123456")
    expect(result.success).toBe(false)
    expect(messageOf(result)).toBe("This number does not belong to MTN.")
  })

  it("can require a known operator", () => {
    const schema = createPhoneSchema(cm, { locale: "en", requireOperator: true })
    expect(schema.safeParse("601234567").success).toBe(false)
    expect(schema.safeParse("651234567").success).toBe(true)
  })

  it("lets messages be overridden", () => {
    const schema = createPhoneSchema(cm, {
      locale: "en",
      messages: { "phone.error.empty": "We need your number" },
    })
    expect(messageOf(schema.safeParse(""))).toBe("We need your number")
  })

  it("works inside an object schema and reports the field path", () => {
    const form = z.object({ phone: createPhoneSchema(cm, { locale: "en" }) })
    expect(form.parse({ phone: "651234567" })).toEqual({ phone: "+237651234567" })
    const result = form.safeParse({ phone: "12" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(["phone"])
  })
})
