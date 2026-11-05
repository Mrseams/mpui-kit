// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Currency } from "@/components/mpui-kit/currency"
import { MpuiKitProvider } from "@/components/mpui-kit/mpui-kit-provider"
import { cm } from "@/lib/mpui-kit/countries/cm"
import type { CountryConfig } from "@/lib/mpui-kit/countries/types"

const NBSP = " "
const senegal: CountryConfig = { ...cm, iso: "SN", currency: "XOF" }

afterEach(() => {
  vi.restoreAllMocks()
})

describe("<Currency />", () => {
  it("formats FCFA with French spacing using the provider's country", () => {
    render(
      <MpuiKitProvider country={cm}>
        <Currency amount={25000} data-testid="price" />
      </MpuiKitProvider>
    )
    expect(screen.getByTestId("price").textContent).toBe(`25${NBSP}000${NBSP}FCFA`)
  })

  it("shows the ISO code of the country's currency", () => {
    render(
      <MpuiKitProvider country={senegal}>
        <Currency amount={25000} display="code" data-testid="price" />
      </MpuiKitProvider>
    )
    expect(screen.getByTestId("price").textContent).toBe(`25${NBSP}000${NBSP}XOF`)
  })

  it("follows the provider's locale and lets a prop override it", () => {
    render(
      <MpuiKitProvider country={cm} locale="en">
        <Currency amount={25000} data-testid="en" />
        <Currency amount={25000} locale="fr" data-testid="fr" />
      </MpuiKitProvider>
    )
    expect(screen.getByTestId("en").textContent).toBe(`25,000${NBSP}FCFA`)
    expect(screen.getByTestId("fr").textContent).toBe(`25${NBSP}000${NBSP}FCFA`)
  })

  it("works without a provider when a currency is passed", () => {
    render(<Currency amount={1500} currency="XAF" data-testid="price" />)
    expect(screen.getByTestId("price").textContent).toBe(`1${NBSP}500${NBSP}FCFA`)
  })

  it("takes the currency from a country prop", () => {
    render(<Currency amount={1500} country={senegal} display="code" data-testid="price" />)
    expect(screen.getByTestId("price").textContent).toBe(`1${NBSP}500${NBSP}XOF`)
  })

  it("passes className and other span props through", () => {
    render(<Currency amount={100} currency="XAF" className="font-bold" data-testid="price" />)
    const element = screen.getByTestId("price")
    expect(element.tagName).toBe("SPAN")
    expect(element).toHaveClass("font-bold")
  })

  it("throws a helpful error when there is no currency source", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<Currency amount={100} />)).toThrow(/needs a `currency` or `country`/)
  })
})
