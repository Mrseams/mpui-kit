// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { usePhoneField, type UsePhoneFieldOptions } from "@/hooks/mpkit/use-phone-field"
import { cm } from "@/lib/mpkit/countries/cm"

/** A plain <input>, not shadcn's: the hook must work with any markup. */
function Harness(props: Partial<UsePhoneFieldOptions> & { onBlurExtra?: () => void }) {
  const { onBlurExtra, ...options } = props
  const field = usePhoneField({ country: cm, ...options })
  return (
    <div>
      <input aria-label="phone" {...field.getInputProps({ onBlur: onBlurExtra })} />
      <output data-testid="national">{field.national}</output>
      <output data-testid="formatted">{field.formatted}</output>
      <output data-testid="operator">{field.operator?.id ?? "none"}</output>
      <output data-testid="valid">{String(field.validation.valid)}</output>
      <output data-testid="issue">{field.validation.issue ?? "none"}</output>
      <output data-testid="touched">{String(field.touched)}</output>
    </div>
  )
}

const input = () => screen.getByLabelText("phone") as HTMLInputElement
const read = (id: string) => screen.getByTestId(id).textContent

describe("usePhoneField", () => {
  it("groups the digits as you type, in a plain input", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(input(), "651234567")
    expect(input()).toHaveValue("6 51 23 45 67")
    expect(read("national")).toBe("651234567")
  })

  it("gives the input the right attributes for a phone number", () => {
    render(<Harness />)
    expect(input()).toHaveAttribute("type", "tel")
    expect(input()).toHaveAttribute("inputmode", "tel")
    expect(input()).toHaveAttribute("autocomplete", "tel-national")
  })

  it("detects the operator and validates as you type", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(read("operator")).toBe("none")

    await user.type(input(), "651")
    expect(read("operator")).toBe("mtn")
    expect(read("valid")).toBe("false")
    expect(read("issue")).toBe("too_short")

    await user.type(input(), "234567")
    expect(read("valid")).toBe("true")
  })

  it("accepts a pasted international number", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(input())
    await user.paste("+237 655 12 34 56")
    expect(input()).toHaveValue("6 55 12 34 56")
    expect(read("operator")).toBe("orange")
  })

  it("caps the length and ignores letters", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(input(), "6a5b12345678999")
    expect(input()).toHaveValue("6 51 23 45 67")
  })

  it("deletes the digit before a separator on Backspace", async () => {
    const user = userEvent.setup()
    render(<Harness defaultValue="65123" />)
    expect(input()).toHaveValue("6 51 23")
    await user.type(input(), "{Backspace}", { initialSelectionStart: 5, initialSelectionEnd: 5 })
    expect(input()).toHaveValue("6 52 3")
  })

  it("starts from a default value, in any accepted form", () => {
    render(<Harness defaultValue="+237651234567" />)
    expect(input()).toHaveValue("6 51 23 45 67")
  })

  it("calls onChange with the digits and the validation", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Harness onChange={onChange} />)
    await user.type(input(), "651234567")
    expect(onChange).toHaveBeenLastCalledWith(
      "651234567",
      expect.objectContaining({ valid: true, e164: "+237651234567" })
    )
  })

  it("can be controlled", async () => {
    function Controlled() {
      const [value, setValue] = useState("")
      return <Harness value={value} onChange={setValue} />
    }
    const user = userEvent.setup()
    render(<Controlled />)
    await user.type(input(), "651")
    expect(input()).toHaveValue("6 51")
  })

  it("stays put when a controlled parent does not update the value", async () => {
    const user = userEvent.setup()
    render(<Harness value="6512" onChange={() => {}} />)
    await user.type(input(), "3")
    expect(input()).toHaveValue("6 51 2")
  })

  it("becomes touched on blur, and still calls your own onBlur", async () => {
    const onBlurExtra = vi.fn()
    const user = userEvent.setup()
    render(<Harness onBlurExtra={onBlurExtra} />)
    expect(read("touched")).toBe("false")

    await user.click(input())
    await user.tab()
    expect(read("touched")).toBe("true")
    expect(onBlurExtra).toHaveBeenCalledTimes(1)
  })

  it("rejects a number from another operator when one is required", async () => {
    const user = userEvent.setup()
    render(<Harness operator="mtn" />)
    await user.type(input(), "655123456")
    expect(read("issue")).toBe("operator_mismatch")
  })

  it("hands back a stable ref callback, so a parent can wrap it", () => {
    const refs = new Set<unknown>()
    function Probe() {
      const field = usePhoneField({ country: cm })
      refs.add(field.inputRef)
      const [, force] = useState(0)
      return (
        <button type="button" onClick={() => force((n) => n + 1)}>
          rerender
        </button>
      )
    }
    render(<Probe />)
    screen.getByRole("button").click()
    expect(refs.size).toBe(1)
  })
})
