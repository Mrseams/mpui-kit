import { describe, expect, it, vi } from "vitest"

import { cm } from "@/lib/mboa/countries/cm"
import { applyPhoneEdit, createPhoneField } from "@/lib/mboa/core/phone-field"

// Runs in Node: the phone field logic needs no DOM.

describe("applyPhoneEdit", () => {
  it("groups the digits as they are typed", () => {
    expect(applyPhoneEdit("", { text: "6" }, cm).formatted).toBe("6")
    expect(applyPhoneEdit("6", { text: "65" }, cm).formatted).toBe("6 5")
    expect(applyPhoneEdit("65", { text: "651" }, cm).formatted).toBe("6 51")
    expect(applyPhoneEdit("651234567", { text: "6 51 23 45 67" }, cm).national).toBe("651234567")
  })

  it("caps the number at its length", () => {
    const result = applyPhoneEdit("651234567", { text: "6 51 23 45 679" }, cm)
    expect(result.national).toBe("651234567")
  })

  it("accepts a pasted international number and sends the caret to the end", () => {
    const result = applyPhoneEdit("", { text: "+237 651 234 567" }, cm)
    expect(result.national).toBe("651234567")
    expect(result.formatted).toBe("6 51 23 45 67")
    expect(result.caretDigits).toBeNull()
    expect(result.caretIndex).toBeNull()
  })

  it("ignores letters", () => {
    expect(applyPhoneEdit("651", { text: "6 51a" }, cm).national).toBe("651")
  })

  it("keeps the caret next to the digit being edited", () => {
    // Typing a "9" after "6 5" in "6 51 2": the text becomes "6 591 2", caret after the 9.
    const result = applyPhoneEdit("6512", { text: "6 591 2", caret: 4 }, cm)
    expect(result.national).toBe("65912")
    expect(result.formatted).toBe("6 59 12")
    expect(result.caretDigits).toBe(3)
    expect(result.caretIndex).toBe(4)
  })

  it("puts the caret after the last digit when typing at the end", () => {
    const result = applyPhoneEdit("65", { text: "6 51", caret: 4 }, cm)
    expect(result.caretDigits).toBe(3)
    expect(result.caretIndex).toBe(result.formatted.length)
  })

  it("deletes the digit before a separator when Backspace lands on the space", () => {
    // "6 51 23" with the caret just after the space that follows "51": Backspace removes the space.
    const result = applyPhoneEdit("65123", { text: "6 5123", caret: 4 }, cm)
    expect(result.national).toBe("6523")
    expect(result.formatted).toBe("6 52 3")
    expect(result.caretDigits).toBe(2)
  })

  it("does not treat an ordinary delete as a separator delete", () => {
    const result = applyPhoneEdit("65123", { text: "6 51 2", caret: 6 }, cm)
    expect(result.national).toBe("6512")
  })

  it("handles an empty result", () => {
    const result = applyPhoneEdit("6", { text: "", caret: 0 }, cm)
    expect(result.national).toBe("")
    expect(result.formatted).toBe("")
  })

  it("treats a missing caret as the end of the text", () => {
    const result = applyPhoneEdit("65", { text: "6 51" }, cm)
    expect(result.caretDigits).toBe(3)
  })
})

describe("createPhoneField", () => {
  it("starts empty, or from an initial value in any accepted form", () => {
    expect(createPhoneField({ country: cm }).getSnapshot().national).toBe("")
    const filled = createPhoneField({ country: cm, initialValue: "+237651234567" })
    expect(filled.getSnapshot()).toMatchObject({
      national: "651234567",
      formatted: "6 51 23 45 67",
    })
  })

  it("validates and detects the operator as you type", () => {
    const field = createPhoneField({ country: cm })

    let snapshot = field.input("65")
    expect(snapshot.operator).toBeNull()
    expect(snapshot.validation.issue).toBe("too_short")

    snapshot = field.input("6 51")
    expect(snapshot.operator?.id).toBe("mtn")

    snapshot = field.input("6 51 23 45 67")
    expect(snapshot.validation.valid).toBe(true)
    expect(snapshot.validation.e164).toBe("+237651234567")
  })

  it("returns the new snapshot from input, and keeps it as the current one", () => {
    const field = createPhoneField({ country: cm })
    const snapshot = field.input("651")
    expect(field.getSnapshot()).toBe(snapshot)
  })

  it("tells the caller where to put the caret", () => {
    const field = createPhoneField({ country: cm, initialValue: "6512" })
    const snapshot = field.input("6 591 2", 4)
    expect(snapshot.formatted).toBe("6 59 12")
    expect(snapshot.caretIndex).toBe(4)
  })

  it("calls onChange after every change with the digits and the validation", () => {
    const onChange = vi.fn()
    const field = createPhoneField({ country: cm, onChange })
    field.input("651234567")
    expect(onChange).toHaveBeenCalledWith(
      "651234567",
      expect.objectContaining({ valid: true, e164: "+237651234567" })
    )
  })

  it("notifies subscribers, and stops after unsubscribe", () => {
    const field = createPhoneField({ country: cm })
    const listener = vi.fn()
    const stop = field.subscribe(listener)
    field.input("6")
    field.input("65")
    expect(listener).toHaveBeenCalledTimes(2)
    stop()
    field.input("651")
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("marks the field touched on blur, once", () => {
    const field = createPhoneField({ country: cm })
    const listener = vi.fn()
    field.subscribe(listener)
    expect(field.getSnapshot().touched).toBe(false)

    field.blur()
    field.blur()
    expect(field.getSnapshot().touched).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("keeps touched when the value changes afterwards", () => {
    const field = createPhoneField({ country: cm })
    field.blur()
    field.input("651")
    expect(field.getSnapshot().touched).toBe(true)
  })

  it("sets a value from code, without a caret, and only notifies on a real change", () => {
    const field = createPhoneField({ country: cm })
    const onChange = vi.fn()
    const again = createPhoneField({ country: cm, onChange })
    again.setValue("+237651234567")
    again.setValue("651234567")
    expect(onChange).toHaveBeenCalledTimes(1)

    field.setValue("651234567")
    expect(field.getSnapshot().caretIndex).toBeNull()
  })

  it("requires an operator when told to", () => {
    const field = createPhoneField({ country: cm, operator: "mtn" })
    expect(field.input("655123456").validation.issue).toBe("operator_mismatch")
    expect(field.input("651234567").validation.valid).toBe(true)
  })

  it("validates again when the operator rules change", () => {
    const field = createPhoneField({ country: cm })
    field.input("655123456")
    expect(field.getSnapshot().validation.valid).toBe(true)

    field.setOptions({ operator: "mtn" })
    expect(field.getSnapshot().validation.issue).toBe("operator_mismatch")

    field.setOptions({ operator: undefined })
    expect(field.getSnapshot().validation.valid).toBe(true)
  })

  it("re-reads the number for a different country", () => {
    const field = createPhoneField({ country: cm, initialValue: "651234567" })
    const shorter = { ...cm, nationalNumberLength: 6, groupSizes: [2, 2, 2] }
    field.setOptions({ country: shorter })
    expect(field.getSnapshot().national).toBe("651234")
  })
})
