import { describe, expect, it } from "vitest"

import { dialHref, isDialable } from "@/lib/mpkit/dial"

describe("isDialable", () => {
  it.each(["*126#", "#150*50#", "*126*1*2#", "+237651234567", "8888"])("accepts %s", (code) => {
    expect(isDialable(code)).toBe(true)
  })

  it.each(["", "abc", "*126# now", "tel:123", "12 34", "javascript:alert(1)", "*126#\n"])(
    "rejects %j",
    (code) => {
      expect(isDialable(code)).toBe(false)
    }
  )
})

describe("dialHref", () => {
  it("percent-encodes # so the code is not cut off as a fragment", () => {
    expect(dialHref("*126#")).toBe("tel:*126%23")
    expect(dialHref("#150*50#")).toBe("tel:%23150*50%23")
  })

  it("keeps a leading plus as a plus", () => {
    // encodeURIComponent turns + into %2B, which dialers also accept.
    expect(dialHref("+237651234567")).toBe("tel:%2B237651234567")
  })

  it("trims surrounding whitespace", () => {
    expect(dialHref("  *126#  ")).toBe("tel:*126%23")
  })

  it("returns undefined for anything that is not a dialable code", () => {
    expect(dialHref("call me")).toBeUndefined()
    expect(dialHref("javascript:alert(1)")).toBeUndefined()
    expect(dialHref("")).toBeUndefined()
  })
})
