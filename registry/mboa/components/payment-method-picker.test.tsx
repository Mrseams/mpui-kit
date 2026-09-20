// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MboaProvider } from "@/components/mboa/mboa-provider"
import {
  PaymentMethodPicker,
  type PaymentMethodPickerProps,
} from "@/components/mboa/payment-method-picker"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"
import type { PaymentSelection } from "@/lib/mboa/payment-methods"

function setup(props: PaymentMethodPickerProps = {}, locale: Locale = "en") {
  const user = userEvent.setup()
  const utils = render(
    <MboaProvider country={cm} locale={locale}>
      <PaymentMethodPicker {...props} />
    </MboaProvider>
  )
  return { user, ...utils }
}

const radio = (name: RegExp | string) => screen.getByRole("radio", { name })

afterEach(() => {
  vi.restoreAllMocks()
})

describe("<PaymentMethodPicker /> structure", () => {
  it("is a labelled group of radios", () => {
    setup()
    expect(screen.getByRole("group", { name: "Payment method" })).toBeInTheDocument()
    expect(screen.getAllByRole("radio")).toHaveLength(4)
  })

  it("offers Mobile Money for operators with a wallet, then card and cash", () => {
    setup()
    const names = screen.getAllByRole("radio").map((item) => item.closest("label")?.textContent)
    expect(names[0]).toContain("MTN Mobile Money")
    expect(names[1]).toContain("Orange Money")
    expect(names[2]).toContain("Bank card")
    expect(names[3]).toContain("Cash")
  })

  it("has nothing selected at first and no phone field", () => {
    setup()
    for (const item of screen.getAllByRole("radio")) expect(item).not.toBeChecked()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("translates to French", () => {
    setup({}, "fr")
    expect(screen.getByRole("group", { name: "Moyen de paiement" })).toBeInTheDocument()
    expect(radio(/Carte bancaire/)).toBeInTheDocument()
    expect(radio(/Espèces/)).toBeInTheDocument()
  })

  it("accepts a custom list of methods and labels", () => {
    setup({
      methods: [
        { id: "cash", kind: "cash", label: "Pay at the door", description: "No fees" },
        { id: "card", kind: "card" },
      ],
    })
    expect(screen.getAllByRole("radio")).toHaveLength(2)
    expect(radio(/Pay at the door/)).toBeInTheDocument()
  })

  it("can use a custom legend", () => {
    setup({ legend: "How do you want to pay?" })
    expect(screen.getByRole("group", { name: "How do you want to pay?" })).toBeInTheDocument()
  })
})

describe("<PaymentMethodPicker /> selecting", () => {
  it("reveals a phone field for the chosen Mobile Money operator", async () => {
    const { user } = setup()
    await user.click(radio(/MTN Mobile Money/))
    expect(radio(/MTN Mobile Money/)).toBeChecked()
    expect(screen.getByLabelText("MTN number")).toBeInTheDocument()
  })

  it("switches the phone field label when another operator is chosen", async () => {
    const { user } = setup()
    await user.click(radio(/MTN Mobile Money/))
    await user.click(radio(/Orange Money/))
    expect(screen.getByLabelText("Orange number")).toBeInTheDocument()
    expect(screen.queryByLabelText("MTN number")).toBeNull()
  })

  it("keeps the typed number when switching between Mobile Money operators", async () => {
    const { user } = setup()
    await user.click(radio(/MTN Mobile Money/))
    await user.type(screen.getByLabelText("MTN number"), "651234567")
    await user.click(radio(/Orange Money/))
    expect(screen.getByLabelText("Orange number")).toHaveValue("6 51 23 45 67")
  })

  it("hides the phone field for card and cash", async () => {
    const { user } = setup()
    await user.click(radio(/MTN Mobile Money/))
    await user.click(radio(/Bank card/))
    expect(screen.queryByRole("textbox")).toBeNull()
    await user.click(radio(/Cash/))
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("moves the selection with the arrow keys", async () => {
    const { user } = setup()
    radio(/MTN Mobile Money/).focus()
    await user.keyboard("{ArrowDown}")
    expect(radio(/Orange Money/)).toBeChecked()
    await user.keyboard("{ArrowDown}")
    expect(radio(/Bank card/)).toBeChecked()
  })

  it("has a single tab stop for the whole group", async () => {
    const { user } = setup()
    await user.tab()
    expect(radio(/MTN Mobile Money/)).toHaveFocus()
    await user.tab()
    // Nothing is selected, so tab leaves the group instead of visiting every card.
    expect(document.body).toHaveFocus()
  })
})

describe("<PaymentMethodPicker /> onChange", () => {
  it("reports card and cash as ready immediately", async () => {
    const onChange = vi.fn()
    const { user } = setup({ onChange })
    await user.click(radio(/Cash/))
    expect(onChange).toHaveBeenLastCalledWith(
      { methodId: "cash", phone: "" },
      expect.objectContaining({ ready: true, e164: null })
    )
  })

  it("reports Mobile Money as ready only with a valid number", async () => {
    const onChange = vi.fn()
    const { user } = setup({ onChange })
    await user.click(radio(/MTN Mobile Money/))
    expect(onChange).toHaveBeenLastCalledWith(
      { methodId: "mtn", phone: "" },
      expect.objectContaining({ ready: false })
    )

    await user.type(screen.getByLabelText("MTN number"), "651234567")
    expect(onChange).toHaveBeenLastCalledWith(
      { methodId: "mtn", phone: "651234567" },
      expect.objectContaining({ ready: true, e164: "+237651234567" })
    )
  })

  it("is not ready when the number belongs to another operator", async () => {
    const onChange = vi.fn()
    const { user } = setup({ onChange })
    await user.click(radio(/MTN Mobile Money/))
    await user.type(screen.getByLabelText("MTN number"), "655123456")
    expect(onChange).toHaveBeenLastCalledWith(
      { methodId: "mtn", phone: "655123456" },
      expect.objectContaining({ ready: false, e164: null })
    )
    await user.tab()
    expect(screen.getByRole("alert")).toHaveTextContent("This number does not belong to MTN.")
  })
})

describe("<PaymentMethodPicker /> controlled and defaults", () => {
  it("starts from a default value", () => {
    setup({ defaultValue: { methodId: "orange", phone: "655123456" } })
    expect(radio(/Orange Money/)).toBeChecked()
    expect(screen.getByLabelText("Orange number")).toHaveValue("6 55 12 34 56")
  })

  it("follows a controlled parent", async () => {
    function Controlled() {
      const [value, setValue] = useState<PaymentSelection>({ methodId: null, phone: "" })
      return <PaymentMethodPicker value={value} onChange={setValue} />
    }
    const user = userEvent.setup()
    render(
      <MboaProvider country={cm} locale="en">
        <Controlled />
      </MboaProvider>
    )
    await user.click(radio(/Cash/))
    expect(radio(/Cash/)).toBeChecked()
  })

  it("does not change on its own when a controlled parent ignores changes", async () => {
    const { user } = setup({ value: { methodId: null, phone: "" }, onChange: () => {} })
    await user.click(radio(/Cash/))
    expect(radio(/Cash/)).not.toBeChecked()
  })
})

describe("<PaymentMethodPicker /> styling", () => {
  it("lets you style each part with classNames and finds them by data-slot", () => {
    const { container } = setup({
      defaultValue: { methodId: "mtn", phone: "" },
      error: "Pick one",
      classNames: {
        legend: "legend-x",
        options: "options-x",
        option: "option-x",
        optionLabel: "label-x",
        optionDescription: "desc-x",
        phone: "phone-x",
        error: "error-x",
      },
    })
    const slot = (name: string) =>
      container.querySelector(`[data-slot="payment-method-picker-${name}"]`)
    expect(slot("legend")).toHaveClass("legend-x")
    expect(slot("options")).toHaveClass("options-x")
    expect(slot("option")).toHaveClass("option-x")
    expect(slot("option-label")).toHaveClass("label-x")
    expect(slot("option-description")).toHaveClass("desc-x")
    expect(slot("error")).toHaveClass("error-x")
    expect(container.querySelector('[data-slot="phone-input"]')).toHaveClass("phone-x")
  })

  it("applies option classes to every card", () => {
    const { container } = setup({ classNames: { option: "option-x" } })
    const cards = container.querySelectorAll('[data-slot="payment-method-picker-option"]')
    expect(cards).toHaveLength(4)
    for (const card of cards) expect(card).toHaveClass("option-x")
  })
})

describe("<PaymentMethodPicker /> states", () => {
  it("shows an error and links it to the group", () => {
    setup({ error: "Choose a payment method to continue." })
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Choose a payment method to continue.")
    expect(screen.getByRole("group").getAttribute("aria-describedby")).toBe(alert.id)
  })

  it("shows an error for the phone field", async () => {
    setup({
      defaultValue: { methodId: "mtn", phone: "" },
      phoneError: "Enter a phone number.",
    })
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a phone number.")
    expect(screen.getByLabelText("MTN number")).toHaveAttribute("aria-invalid", "true")
  })

  it("disables every card and the phone field", async () => {
    setup({ disabled: true, defaultValue: { methodId: "mtn", phone: "" } })
    for (const item of screen.getAllByRole("radio")) expect(item).toBeDisabled()
    expect(screen.getByLabelText("MTN number")).toBeDisabled()
  })

  it("shows a custom operator logo instead of the color dot", () => {
    const { container } = setup({ operatorLogos: { mtn: <span data-testid="mtn-logo" /> } })
    expect(container.querySelector('[data-testid="mtn-logo"]')).not.toBeNull()
  })

  it("throws a helpful error when there is no country", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<PaymentMethodPicker />)).toThrow(/no country set/)
  })
})
