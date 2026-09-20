// @vitest-environment jsdom
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  MboaProvider,
  useCountry,
  useLocale,
  useT,
  type MboaProviderProps,
} from "@/components/mboa/mboa-provider"
import { cm } from "@/lib/mboa/countries/cm"
import type { CountryConfig } from "@/lib/mboa/countries/types"

const other: CountryConfig = { ...cm, iso: "ZZ", defaultLocale: "en" }

const withProvider =
  (props: Omit<MboaProviderProps, "children">) =>
  ({ children }: { children: ReactNode }) => <MboaProvider {...props}>{children}</MboaProvider>

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useCountry", () => {
  it("returns the provider's country", () => {
    const { result } = renderHook(() => useCountry(), { wrapper: withProvider({ country: cm }) })
    expect(result.current).toBe(cm)
  })

  it("lets a country prop win over the provider", () => {
    const { result } = renderHook(() => useCountry(other), {
      wrapper: withProvider({ country: cm }),
    })
    expect(result.current).toBe(other)
  })

  it("works without a provider when a country is passed", () => {
    const { result } = renderHook(() => useCountry(cm))
    expect(result.current).toBe(cm)
  })

  it("throws a helpful error when there is no country anywhere", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useCountry())).toThrow(/no country set/)
  })
})

describe("useLocale", () => {
  it("prefers the prop, then the provider, then the country default, then fr", () => {
    const provided = renderHook(() => useLocale(), {
      wrapper: withProvider({ country: cm, locale: "en" }),
    })
    expect(provided.result.current).toBe("en")

    const fromProp = renderHook(() => useLocale("fr"), {
      wrapper: withProvider({ country: cm, locale: "en" }),
    })
    expect(fromProp.result.current).toBe("fr")

    const fromCountry = renderHook(() => useLocale(), { wrapper: withProvider({ country: other }) })
    expect(fromCountry.result.current).toBe("en")

    const fallback = renderHook(() => useLocale())
    expect(fallback.result.current).toBe("fr")
  })
})

describe("useT", () => {
  it("translates in the provider's locale", () => {
    const { result } = renderHook(() => useT(), { wrapper: withProvider({ locale: "en" }) })
    expect(result.current("ussd.retry")).toBe("Try again")
  })

  it("lets a locale argument override the provider", () => {
    const { result } = renderHook(() => useT("fr"), { wrapper: withProvider({ locale: "en" }) })
    expect(result.current("ussd.retry")).toBe("Réessayer")
  })

  it("applies message overrides from the provider", () => {
    const messages = { "checkout.pay": "Book for {amount}" }
    const { result } = renderHook(() => useT(), {
      wrapper: withProvider({ locale: "en", messages }),
    })
    expect(result.current("checkout.pay", { amount: "50 000 FCFA" })).toBe("Book for 50 000 FCFA")
    expect(result.current("ussd.retry")).toBe("Try again")
  })

  it("returns a stable translator between renders", () => {
    const messages = { "ussd.retry": "Again" }
    const { result, rerender } = renderHook(() => useT(), {
      wrapper: withProvider({ locale: "en", messages }),
    })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
