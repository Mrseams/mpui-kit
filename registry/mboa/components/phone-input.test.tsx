// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef, useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MboaProvider } from "@/components/mboa/mboa-provider"
import { PhoneInput, type PhoneInputProps } from "@/components/mboa/phone-input"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"

function setup(props: PhoneInputProps = {}, locale: Locale = "en") {
  const user = userEvent.setup()
  const utils = render(
    <MboaProvider country={cm} locale={locale}>
      <PhoneInput {...props} />
    </MboaProvider>
  )
  return { user, ...utils, input: screen.getByRole("textbox") as HTMLInputElement }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("<PhoneInput /> labels and hints", () => {
  it("has an accessible label and a hint in the current language", () => {
    const { input } = setup()
    expect(screen.getByLabelText("Phone number")).toBe(input)
    expect(screen.getByText("Enter your 9-digit number, without the country code.")).toBeVisible()
  })

  it("translates the label to French", () => {
    setup({}, "fr")
    expect(screen.getByLabelText("Numéro de téléphone")).toBeVisible()
  })

  it("can hide the visible label when an aria-label is given", () => {
    setup({ label: false, "aria-label": "Mobile" })
    expect(screen.getByLabelText("Mobile")).toBeVisible()
    expect(screen.queryByText("Phone number")).toBeNull()
  })

  it("shows the country calling code as a prefix", () => {
    setup()
    expect(screen.getByText("+237")).toBeInTheDocument()
  })
})

describe("<PhoneInput /> typing", () => {
  it("groups digits as you type and caps the length", async () => {
    const { user, input } = setup()
    await user.type(input, "651234567")
    expect(input).toHaveValue("6 51 23 45 67")
    await user.type(input, "999")
    expect(input).toHaveValue("6 51 23 45 67")
  })

  it("reports the digits and the validation result on change", async () => {
    const onChange = vi.fn()
    const { user, input } = setup({ onChange })
    await user.type(input, "651234567")
    expect(onChange).toHaveBeenLastCalledWith(
      "651234567",
      expect.objectContaining({ valid: true, e164: "+237651234567" })
    )
  })

  it("is not valid until the number is complete", async () => {
    const onChange = vi.fn()
    const { user, input } = setup({ onChange })
    await user.type(input, "6512")
    expect(onChange).toHaveBeenLastCalledWith(
      "6512",
      expect.objectContaining({ valid: false, issue: "too_short", e164: null })
    )
  })

  it("accepts a pasted international number", async () => {
    const { user, input } = setup()
    await user.click(input)
    await user.paste("+237 651 234 567")
    expect(input).toHaveValue("6 51 23 45 67")
  })

  it("deletes the digit before a separator when backspace hits a space", async () => {
    const { user, input } = setup({ defaultValue: "65123" }) // shows "6 51 23"
    expect(input).toHaveValue("6 51 23")
    // Caret just after the space that follows "51".
    await user.type(input, "{Backspace}", { initialSelectionStart: 5, initialSelectionEnd: 5 })
    expect(input).toHaveValue("6 52 3")
  })

  it("does not accept letters", async () => {
    const { user, input } = setup()
    await user.type(input, "6a5b1")
    expect(input).toHaveValue("6 51")
  })
})

describe("<PhoneInput /> styling", () => {
  it("puts className on the outer wrapper, like the other components", () => {
    const { container } = setup({ className: "wrapper-x" })
    expect(container.querySelector('[data-slot="phone-input"]')).toHaveClass("wrapper-x")
    expect(screen.getByRole("textbox")).not.toHaveClass("wrapper-x")
  })

  it("lets you style each part with classNames and finds them by data-slot", async () => {
    const { user, input, container } = setup({
      classNames: {
        label: "label-x",
        field: "field-x",
        prefix: "prefix-x",
        input: "input-x",
        badge: "badge-x",
        hint: "hint-x",
      },
    })
    await user.type(input, "651")
    const slot = (name: string) => container.querySelector(`[data-slot="phone-input-${name}"]`)
    expect(slot("label")).toHaveClass("label-x")
    expect(slot("field")).toHaveClass("field-x")
    expect(slot("prefix")).toHaveClass("prefix-x")
    expect(slot("input")).toHaveClass("input-x")
    expect(input).toHaveClass("input-x")
    expect(slot("badge")).toHaveClass("badge-x")
    expect(slot("hint")).toHaveClass("hint-x")
  })

  it("styles the error through classNames.error", async () => {
    const { container } = setup({ error: "Nope", classNames: { error: "error-x" } })
    expect(container.querySelector('[data-slot="phone-input-error"]')).toHaveClass("error-x")
  })
})

describe("<PhoneInput /> operator detection", () => {
  it("shows the operator badge once the prefix matches", async () => {
    const { user, input } = setup()
    await user.type(input, "65")
    expect(screen.queryByText("MTN")).toBeNull()
    expect(screen.queryByText("Orange")).toBeNull()

    await user.type(input, "1")
    expect(screen.getByText("MTN")).toBeInTheDocument()
  })

  it("switches operator when the number changes", async () => {
    const { user, input } = setup()
    await user.type(input, "655")
    expect(screen.getByText("Orange")).toBeInTheDocument()
    expect(screen.queryByText("MTN")).toBeNull()
  })

  it("announces the detected operator to screen readers", async () => {
    const { user, input } = setup()
    await user.type(input, "651")
    expect(screen.getByText("MTN number")).toBeInTheDocument()
  })

  it("shows a custom logo instead of the color dot", async () => {
    const { user, input } = setup({ operatorLogos: { mtn: <span data-testid="logo" /> } })
    await user.type(input, "651")
    expect(screen.getByTestId("logo")).toBeInTheDocument()
  })
})

describe("<PhoneInput /> validation messages", () => {
  it("does not show an error before the field is touched", async () => {
    const { user, input } = setup()
    await user.type(input, "6512")
    expect(screen.queryByRole("alert")).toBeNull()
    expect(input).not.toHaveAttribute("aria-invalid")
  })

  it("shows the error on blur and links it to the input", async () => {
    const { user, input } = setup()
    await user.type(input, "6512")
    await user.tab()
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("The number is too short. It should have 9 digits.")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input.getAttribute("aria-describedby")).toContain(alert.id)
  })

  it("shows the error in French", async () => {
    const { user, input } = setup({}, "fr")
    await user.type(input, "6512")
    await user.tab()
    expect(screen.getByRole("alert")).toHaveTextContent("Le numéro est trop court")
  })

  it("does not complain about an untouched empty field on blur unless required", async () => {
    const { user, input } = setup()
    await user.click(input)
    await user.tab()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("complains about an empty required field on blur", async () => {
    const { user, input } = setup({ required: true })
    await user.click(input)
    await user.tab()
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a phone number.")
  })

  it("lets an error prop from a form library win", () => {
    const { input } = setup({ error: "Custom error" })
    expect(screen.getByRole("alert")).toHaveTextContent("Custom error")
    expect(input).toHaveAttribute("aria-invalid", "true")
  })

  it("rejects a number from another operator when one is required", async () => {
    const { user, input } = setup({ operator: "mtn" })
    await user.type(input, "655123456")
    await user.tab()
    expect(screen.getByRole("alert")).toHaveTextContent("This number does not belong to MTN.")
  })

  it("does not reject a prefix it does not know when an operator is required", async () => {
    const { user, input } = setup({ operator: "mtn" })
    await user.type(input, "601234567")
    await user.tab()
    expect(screen.queryByRole("alert")).toBeNull()
  })
})

describe("<PhoneInput /> controlled and forms", () => {
  it("shows a controlled E.164 value as grouped national digits", () => {
    const { input } = setup({ value: "+237651234567", onChange: () => {} })
    expect(input).toHaveValue("6 51 23 45 67")
  })

  it("stays put when a controlled parent does not update the value", async () => {
    const onChange = vi.fn()
    const { user, input } = setup({ value: "6512", onChange })
    await user.type(input, "3")
    expect(onChange).toHaveBeenLastCalledWith("65123", expect.anything())
    expect(input).toHaveValue("6 51 2")
  })

  it("follows a controlled parent that updates the value", async () => {
    function Controlled() {
      const [value, setValue] = useState("")
      return <PhoneInput value={value} onChange={setValue} />
    }
    const user = userEvent.setup()
    render(
      <MboaProvider country={cm} locale="en">
        <Controlled />
      </MboaProvider>
    )
    const input = screen.getByRole("textbox")
    await user.type(input, "651")
    expect(input).toHaveValue("6 51")
  })

  it("submits the E.164 number with a native form through a hidden field", async () => {
    const { user, input, container } = setup({ name: "phone" })
    const hidden = () =>
      container.querySelector<HTMLInputElement>('input[type="hidden"][name="phone"]')

    expect(hidden()).toHaveValue("")
    await user.type(input, "6512")
    expect(hidden()).toHaveValue("")
    await user.type(input, "34567")
    expect(hidden()).toHaveValue("+237651234567")
    expect(input).not.toHaveAttribute("name")
  })

  it("forwards its ref to the text input", () => {
    const ref = createRef<HTMLInputElement>()
    const { input } = setup({ ref })
    expect(ref.current).toBe(input)
  })

  it("throws a helpful error when there is no country", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<PhoneInput />)).toThrow(/no country set/)
  })
})
