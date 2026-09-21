import { describe, expect, it } from "vitest"

import { cm } from "@/lib/mpkit/countries/cm"
import type { CountryConfig } from "@/lib/mpkit/countries/types"
import {
  caretIndexAfterDigits,
  countDigits,
  detectOperator,
  formatInternational,
  formatNational,
  normalizePhoneInput,
  parseNationalNumber,
  toE164,
  validatePhone,
} from "@/lib/mpkit/phone"

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
    ["651234567", "mtn"],
    ["654123456", "mtn"],
    ["680123456", "mtn"],
    ["687123456", "orange"],
    ["655123456", "orange"],
    ["661234567", "nexttel"],
    ["621234567", "camtel"],
    // 67x and 69x, supplied on 2026-09-21
    ["670123456", "mtn"],
    ["671234567", "mtn"],
    ["679123456", "mtn"],
    ["690123456", "orange"],
    ["691234567", "orange"],
    ["699123456", "orange"],
  ])("detects %s as %s", (national, id) => {
    expect(detectOperator(national, cm)?.id).toBe(id)
  })

  it("detects as soon as a full prefix is typed", () => {
    expect(detectOperator("651", cm)?.id).toBe("mtn")
    expect(detectOperator("655", cm)?.id).toBe("orange")
  })

  it.each([
    // MTN 654 is split: 6540-6545, 65460, 65468, 6547-6549
    ["654012345", "mtn"],
    ["654512345", "mtn"],
    ["654601234", "mtn"],
    ["654681234", "mtn"],
    ["654712345", "mtn"],
    ["654912345", "mtn"],
    // Orange 688: 0XX-8XX, 90X-95X, 960-964
    ["688012345", "orange"],
    ["688812345", "orange"],
    ["688901234", "orange"],
    ["688951234", "orange"],
    ["688960123", "orange"],
    ["688964123", "orange"],
    // Camtel: 620-621, 6220, 6225
    ["620123456", "camtel"],
    ["622012345", "camtel"],
    ["622512345", "camtel"],
  ])("detects %s as %s inside a split range", (national, id) => {
    expect(detectOperator(national, cm)?.id).toBe(id)
  })

  it.each([
    "654612345", // 65461 is not in the supplied ranges
    "654691234", // 65469 is not in the supplied ranges
    "688965123", // 688 965 is not in the supplied ranges
    "688969123", // 688 969 is not in the supplied ranges
    "688991234", // 688 99X is not in the supplied ranges
    "622112345", // 6221 is not in the supplied ranges
    "623123456", // 623 is not in the supplied ranges
    "684123456", // 684 is not in the supplied ranges (MTN ends at 683)
    "685123456", // 685 is not in the supplied ranges
    "689123456", // 689 is not in the supplied ranges (Orange 688 is split; 690 starts the next block)
  ])("returns null for %s, which is outside the supplied ranges", (national) => {
    expect(detectOperator(national, cm)).toBeNull()
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
    ["651234567"],
    ["6 51 23 45 67"],
    ["651-234-567"],
    ["+237 651 234 567"],
    ["+237651234567"],
    ["00237651234567"],
    ["237651234567"],
    ["(237) 651 234 567"],
  ])("extracts 651234567 from %s", (raw) => {
    expect(parseNationalNumber(raw, cm)).toEqual({ national: "651234567" })
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
    expect(normalizePhoneInput("65123456789999", cm)).toBe("651234567")
  })

  it("keeps partial input as typed", () => {
    expect(normalizePhoneInput("65 12", cm)).toBe("6512")
  })
})

describe("formatNational / formatInternational", () => {
  it("groups a full number", () => {
    expect(formatNational("651234567", cm)).toBe("6 51 23 45 67")
  })

  it("groups partial input without trailing spaces", () => {
    expect(formatNational("", cm)).toBe("")
    expect(formatNational("6", cm)).toBe("6")
    expect(formatNational("6512", cm)).toBe("6 51 2")
    expect(formatNational("65123", cm)).toBe("6 51 23")
  })

  it("keeps extra digits in a final group", () => {
    expect(formatNational("6512345678", cm)).toBe("6 51 23 45 67 8")
  })

  it("formats the international form", () => {
    expect(formatInternational("651234567", cm)).toBe("+237 6 51 23 45 67")
  })
})

describe("validatePhone", () => {
  it("accepts a valid number and returns E.164 and the operator", () => {
    const result = validatePhone("6 51 23 45 67", cm)
    expect(result.valid).toBe(true)
    expect(result.e164).toBe("+237651234567")
    expect(result.operator?.id).toBe("mtn")
    expect(result.issue).toBeUndefined()
  })

  it("accepts international input", () => {
    expect(validatePhone("+237 687 123 456", cm).e164).toBe("+237687123456")
  })

  it("reports empty input", () => {
    expect(validatePhone("", cm).issue).toBe("empty")
    expect(validatePhone("+2", cm).issue).toBe("empty")
  })

  it("reports too short and still detects the operator", () => {
    const result = validatePhone("6512", cm)
    expect(result.valid).toBe(false)
    expect(result.issue).toBe("too_short")
    expect(result.e164).toBeNull()
    expect(result.operator?.id).toBe("mtn")
  })

  it("reports too long", () => {
    expect(validatePhone("6512345678", cm).issue).toBe("too_long")
  })

  it("reports wrong country and invalid characters before length", () => {
    expect(validatePhone("+33612345678", cm).issue).toBe("wrong_country")
    expect(validatePhone("651abc567", cm).issue).toBe("invalid_chars")
  })

  it("accepts an unknown operator by default and rejects it when required", () => {
    expect(validatePhone("601234567", cm).valid).toBe(true)
    const strict = validatePhone("601234567", cm, { requireOperator: true })
    expect(strict.valid).toBe(false)
    expect(strict.issue).toBe("unknown_operator")
  })
})

describe("validatePhone with a required operator", () => {
  it("accepts a number from the required operator", () => {
    expect(validatePhone("651234567", cm, { operator: "mtn" }).valid).toBe(true)
  })

  it("rejects a number from a different known operator", () => {
    const result = validatePhone("655123456", cm, { operator: "mtn" })
    expect(result.valid).toBe(false)
    expect(result.issue).toBe("operator_mismatch")
    expect(result.operator?.id).toBe("orange")
    expect(result.e164).toBeNull()
  })

  it("does not block a prefix that matches no known operator", () => {
    // Prefix data is community-maintained and may be incomplete.
    expect(validatePhone("601234567", cm, { operator: "mtn" }).valid).toBe(true)
  })

  it("is strict about unknown prefixes when requireOperator is also set", () => {
    const result = validatePhone("601234567", cm, { operator: "mtn", requireOperator: true })
    expect(result.issue).toBe("unknown_operator")
  })

  it("still reports length problems first", () => {
    expect(validatePhone("6551", cm, { operator: "mtn" }).issue).toBe("too_short")
  })
})

describe("toE164", () => {
  it("returns the E.164 number or null", () => {
    expect(toE164("651234567", cm)).toBe("+237651234567")
    expect(toE164("6512", cm)).toBeNull()
  })

  it("uses the country's own calling code", () => {
    expect(toE164("0712345678", trunkCountry)).toBe("+999712345678")
  })
})

describe("countDigits", () => {
  it("counts digits and ignores separators", () => {
    expect(countDigits("6 51 23")).toBe(5)
    expect(countDigits("+237 (651)")).toBe(6)
    expect(countDigits("")).toBe(0)
    expect(countDigits("abc")).toBe(0)
  })
})

describe("caretIndexAfterDigits", () => {
  it("returns the index just after the nth digit", () => {
    // "6 51 23": digits at indexes 0, 2, 3, 5, 6
    expect(caretIndexAfterDigits("6 51 23", 1)).toBe(1)
    expect(caretIndexAfterDigits("6 51 23", 2)).toBe(3)
    expect(caretIndexAfterDigits("6 51 23", 3)).toBe(4)
    expect(caretIndexAfterDigits("6 51 23", 4)).toBe(6)
    expect(caretIndexAfterDigits("6 51 23", 5)).toBe(7)
  })

  it("puts the caret at the start for zero digits", () => {
    expect(caretIndexAfterDigits("6 51", 0)).toBe(0)
  })

  it("puts the caret at the end when there are fewer digits than asked", () => {
    expect(caretIndexAfterDigits("6 51", 9)).toBe(4)
    expect(caretIndexAfterDigits("", 2)).toBe(0)
  })
})
