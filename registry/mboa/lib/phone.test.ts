import { describe, expect, it } from "vitest"

import { cm } from "@/lib/mboa/countries/cm"
import type { CountryConfig } from "@/lib/mboa/countries/types"
import {
  detectOperator,
  formatInternational,
  formatNational,
  normalizePhoneInput,
  parseNationalNumber,
  toE164,
  validatePhone,
} from "@/lib/mboa/phone"

// Synthetic country with a trunk prefix, to test behavior Cameroon does not use.
const trunkCountry: CountryConfig = {
  ...cm,
  iso: "ZZ",
  callingCode: "999",
  nationalNumberLength: 9,
  trunkPrefix: "0",
  operators: [{ id: "a", name: "A", color: "#000", prefixes: ["71"] }],
}

describe("detectOperator", () => {
  it.each([
    ["671234567", "mtn"],
    ["654123456", "mtn"],
    ["680123456", "mtn"],
    ["691234567", "orange"],
    ["655123456", "orange"],
    ["661234567", "nexttel"],
    ["621234567", "camtel"],
  ])("detects %s as %s", (national, id) => {
    expect(detectOperator(national, cm)?.id).toBe(id)
  })

  it("detects as soon as a full prefix is typed", () => {
    expect(detectOperator("67", cm)?.id).toBe("mtn")
    expect(detectOperator("655", cm)?.id).toBe("orange")
  })

  it("returns null while the prefix is still ambiguous or unknown", () => {
    expect(detectOperator("", cm)).toBeNull()
    expect(detectOperator("6", cm)).toBeNull()
    expect(detectOperator("65", cm)).toBeNull()
    expect(detectOperator("601234567", cm)).toBeNull()
  })
})

describe("parseNationalNumber", () => {
  it.each([
    ["671234567"],
    ["6 71 23 45 67"],
    ["671-234-567"],
    ["+237 671 234 567"],
    ["+237671234567"],
    ["00237671234567"],
    ["237671234567"],
    ["(237) 671 234 567"],
  ])("extracts 671234567 from %s", (raw) => {
    expect(parseNationalNumber(raw, cm)).toEqual({ national: "671234567" })
  })

  it("treats a partial calling code after + as empty, not as an error", () => {
    expect(parseNationalNumber("+", cm)).toEqual({ national: "" })
    expect(parseNationalNumber("+2", cm)).toEqual({ national: "" })
    expect(parseNationalNumber("+23", cm)).toEqual({ national: "" })
    expect(parseNationalNumber("+237", cm)).toEqual({ national: "" })
  })

  it("does not strip a leading 237 from a short input that could be a national number", () => {
    expect(parseNationalNumber("2371", cm).national).toBe("2371")
  })

  it("flags another country's calling code", () => {
    expect(parseNationalNumber("+33 6 12 34 56 78", cm).issue).toBe("wrong_country")
  })

  it("flags unexpected characters", () => {
    expect(parseNationalNumber("67abc", cm).issue).toBe("invalid_chars")
  })

  it("strips a trunk prefix for countries that use one", () => {
    expect(parseNationalNumber("0712345678", trunkCountry).national).toBe("712345678")
    expect(parseNationalNumber("+999 712345678", trunkCountry).national).toBe("712345678")
  })
})

describe("normalizePhoneInput", () => {
  it("caps at the national number length", () => {
    expect(normalizePhoneInput("67123456789999", cm)).toBe("671234567")
  })

  it("keeps partial input as typed", () => {
    expect(normalizePhoneInput("67 12", cm)).toBe("6712")
  })
})

describe("formatNational / formatInternational", () => {
  it("groups a full number", () => {
    expect(formatNational("671234567", cm)).toBe("6 71 23 45 67")
  })

  it("groups partial input without trailing spaces", () => {
    expect(formatNational("", cm)).toBe("")
    expect(formatNational("6", cm)).toBe("6")
    expect(formatNational("6712", cm)).toBe("6 71 2")
    expect(formatNational("67123", cm)).toBe("6 71 23")
  })

  it("keeps extra digits in a final group", () => {
    expect(formatNational("6712345678", cm)).toBe("6 71 23 45 67 8")
  })

  it("formats the international form", () => {
    expect(formatInternational("671234567", cm)).toBe("+237 6 71 23 45 67")
  })
})

describe("validatePhone", () => {
  it("accepts a valid number and returns E.164 and the operator", () => {
    const result = validatePhone("6 71 23 45 67", cm)
    expect(result.valid).toBe(true)
    expect(result.e164).toBe("+237671234567")
    expect(result.operator?.id).toBe("mtn")
    expect(result.issue).toBeUndefined()
  })

  it("accepts international input", () => {
    expect(validatePhone("+237 691 234 567", cm).e164).toBe("+237691234567")
  })

  it("reports empty input", () => {
    expect(validatePhone("", cm).issue).toBe("empty")
    expect(validatePhone("+2", cm).issue).toBe("empty")
  })

  it("reports too short and still detects the operator", () => {
    const result = validatePhone("6712", cm)
    expect(result.valid).toBe(false)
    expect(result.issue).toBe("too_short")
    expect(result.e164).toBeNull()
    expect(result.operator?.id).toBe("mtn")
  })

  it("reports too long", () => {
    expect(validatePhone("6712345678", cm).issue).toBe("too_long")
  })

  it("reports wrong country and invalid characters before length", () => {
    expect(validatePhone("+33612345678", cm).issue).toBe("wrong_country")
    expect(validatePhone("671abc567", cm).issue).toBe("invalid_chars")
  })

  it("accepts an unknown operator by default and rejects it when required", () => {
    expect(validatePhone("601234567", cm).valid).toBe(true)
    const strict = validatePhone("601234567", cm, { requireOperator: true })
    expect(strict.valid).toBe(false)
    expect(strict.issue).toBe("unknown_operator")
  })
})

describe("toE164", () => {
  it("returns the E.164 number or null", () => {
    expect(toE164("671234567", cm)).toBe("+237671234567")
    expect(toE164("6712", cm)).toBeNull()
  })

  it("uses the country's own calling code", () => {
    expect(toE164("0712345678", trunkCountry)).toBe("+999712345678")
  })
})
