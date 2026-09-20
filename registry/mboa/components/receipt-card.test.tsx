// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MboaProvider } from "@/components/mboa/mboa-provider"
import { ReceiptCard, type ReceiptCardProps } from "@/components/mboa/receipt-card"
import type { PaymentReceipt } from "@/lib/mboa/checkout-machine"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"

const NBSP = " "

const receipt: PaymentReceipt = {
  reference: "PAY-8F2K-2291",
  amount: 25000,
  currency: "XAF",
  methodId: "mtn",
  phone: "+237651234567",
  paidAt: Date.UTC(2026, 0, 1, 12, 0),
}

function setup(props: Partial<ReceiptCardProps> = {}, locale: Locale = "en") {
  return render(
    <MboaProvider country={cm} locale={locale}>
      <ReceiptCard receipt={receipt} {...props} />
    </MboaProvider>
  )
}

/** The text of the <dd> that follows the <dt> with this label. */
function valueOf(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling?.textContent
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("<ReceiptCard />", () => {
  it("is a labelled region with a title", () => {
    setup()
    const region = screen.getByRole("region", { name: "Payment received" })
    expect(within(region).getByRole("heading", { name: "Payment received" })).toBeVisible()
  })

  it("shows the amount in FCFA, grouped for the language", () => {
    setup()
    expect(valueOf("Amount")).toBe(`25,000${NBSP}FCFA`)
  })

  it("names the payment method", () => {
    setup()
    expect(valueOf("Method")).toBe("MTN Mobile Money")
  })

  it("shows the phone number in international format", () => {
    setup()
    expect(valueOf("Phone")).toBe("+237 6 51 23 45 67")
  })

  it("leaves out the phone row when there is no number, as for cash", () => {
    setup({ receipt: { ...receipt, methodId: "cash", phone: undefined } })
    expect(valueOf("Method")).toBe("Cash")
    expect(screen.queryByText("Phone", { selector: "dt" })).toBeNull()
  })

  it("shows the reference and a date", () => {
    setup()
    expect(valueOf("Reference")).toBe("PAY-8F2K-2291")
    expect(valueOf("Date")).toContain("2026")
  })

  it("adds extra detail rows after the payment details", () => {
    setup({
      details: [
        { label: "Apartment", value: "Studio, Bastos" },
        { label: "Nights", value: 3 },
      ],
    })
    expect(valueOf("Apartment")).toBe("Studio, Bastos")
    expect(valueOf("Nights")).toBe("3")
  })

  it("has no Done button unless onDone is given", () => {
    setup()
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("calls onDone from the Done button", async () => {
    const onDone = vi.fn()
    setup({ onDone })
    await userEvent.click(screen.getByRole("button", { name: "Done" }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("translates to French", () => {
    setup({}, "fr")
    expect(screen.getByRole("region", { name: "Paiement reçu" })).toBeVisible()
    expect(valueOf("Montant")).toBe(`25${NBSP}000${NBSP}FCFA`)
    expect(valueOf("Référence")).toBe("PAY-8F2K-2291")
    expect(valueOf("Téléphone")).toBe("+237 6 51 23 45 67")
  })

  it("passes a ref and other section props through, so a parent can focus it", () => {
    const ref = createRef<HTMLElement>()
    setup({ ref, tabIndex: -1, className: "custom" })
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current).toHaveAttribute("tabindex", "-1")
    expect(ref.current).toHaveClass("custom")
  })

  it("shows an unformatted number as it is", () => {
    setup({ receipt: { ...receipt, phone: "not a number" } })
    expect(valueOf("Phone")).toBe("not a number")
  })

  it("throws a helpful error when there is no country", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<ReceiptCard receipt={receipt} />)).toThrow(/no country set/)
  })
})
