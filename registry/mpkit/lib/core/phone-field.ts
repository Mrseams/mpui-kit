import type { CountryConfig, OperatorConfig } from "@/lib/mpkit/countries/types"
import { createStore, type Listener } from "@/lib/mpkit/core/store"
import {
  caretIndexAfterDigits,
  countDigits,
  formatNational,
  normalizePhoneInput,
  validatePhone,
  type PhoneValidation,
} from "@/lib/mpkit/phone"

/** What the user just did to the text of a phone field. */
export interface PhoneEdit {
  /** The text in the field after the edit. */
  text: string
  /** Where the caret is after the edit. Defaults to the end. */
  caret?: number
}

export interface PhoneEditResult {
  /** The national number as digits, without spaces or country code. */
  national: string
  /** The number grouped for display, for example "6 51 23 45 67". */
  formatted: string
  /**
   * How many digits should sit before the caret once the text is regrouped, or
   * null when the edit changed the digits themselves (a paste, a country code)
   * and the caret should go to the end.
   */
  caretDigits: number | null
  /** The caret position in `formatted` for `caretDigits`, or null. */
  caretIndex: number | null
}

/**
 * Works out what a phone field should show after an edit. It regroups the
 * digits as you type, keeps the caret next to the digit you were editing, and
 * deletes a digit when Backspace lands on a separator instead of stalling.
 * Pure: no DOM, no framework.
 */
export function applyPhoneEdit(
  previousNational: string,
  edit: PhoneEdit,
  country: CountryConfig
): PhoneEditResult {
  const { text } = edit
  const caret = edit.caret ?? text.length
  const previousFormatted = formatNational(previousNational, country)

  let national = normalizePhoneInput(text, country)
  let digitsBeforeCaret = countDigits(text.slice(0, caret))

  // Only re-grouping (no paste, no country code, no trimming) keeps the caret in place.
  const onlyRegrouped = !text.includes("+") && text.replace(/\D/g, "") === national

  if (
    national === previousNational &&
    text.length < previousFormatted.length &&
    digitsBeforeCaret > 0
  ) {
    // The user deleted a separator. Delete the digit before it instead, so Backspace never stalls.
    national = national.slice(0, digitsBeforeCaret - 1) + national.slice(digitsBeforeCaret)
    digitsBeforeCaret -= 1
  }

  const formatted = formatNational(national, country)
  const caretDigits = onlyRegrouped ? digitsBeforeCaret : null
  return {
    national,
    formatted,
    caretDigits,
    caretIndex: caretDigits === null ? null : caretIndexAfterDigits(formatted, caretDigits),
  }
}

export interface PhoneFieldOptions {
  country: CountryConfig
  /** Initial value. A national number or an E.164 number. */
  initialValue?: string
  /** Reject numbers whose prefix matches no known operator. */
  requireOperator?: boolean
  /** Id of the operator the number must belong to, e.g. "mtn". */
  operator?: string
  /** Called after every change, with the national digits and the validation result. */
  onChange?: (national: string, validation: PhoneValidation) => void
}

export interface PhoneFieldSnapshot {
  national: string
  formatted: string
  validation: PhoneValidation
  /** The operator detected from the prefix, even while the number is incomplete. */
  operator: OperatorConfig | null
  /** True once the field has lost focus, so a UI knows when to start showing errors. */
  touched: boolean
  /** Where to put the caret after the last edit, or null to leave it at the end. */
  caretIndex: number | null
}

export interface PhoneFieldController {
  getSnapshot: () => PhoneFieldSnapshot
  subscribe: (listener: Listener) => () => void
  /** Call this on every edit with the field's text and caret. Returns the new snapshot. */
  input: (text: string, caret?: number) => PhoneFieldSnapshot
  /** Sets the value from code, for example from saved data. No caret is kept. */
  setValue: (value: string) => void
  /** Call this when the field loses focus. */
  blur: () => void
  /** Changes the country or the operator rules, and validates again. */
  setOptions: (options: Partial<Omit<PhoneFieldOptions, "initialValue" | "onChange">>) => void
}

/**
 * A phone field with no UI framework in it. Feed it the text of any input and it
 * tells you what to show, where the caret goes, which operator was detected and
 * whether the number is valid.
 *
 * @example
 * const field = createPhoneField({ country: cm })
 * input.addEventListener("input", () => {
 *   const { formatted, caretIndex } = field.input(input.value, input.selectionStart ?? undefined)
 *   input.value = formatted
 *   if (caretIndex !== null) input.setSelectionRange(caretIndex, caretIndex)
 * })
 */
export function createPhoneField(initialOptions: PhoneFieldOptions): PhoneFieldController {
  let country = initialOptions.country
  let requireOperator = initialOptions.requireOperator
  let operator = initialOptions.operator
  const onChange = initialOptions.onChange

  const build = (
    national: string,
    touched: boolean,
    caretIndex: number | null
  ): PhoneFieldSnapshot => {
    const validation = validatePhone(national, country, { requireOperator, operator })
    return {
      national,
      formatted: formatNational(national, country),
      validation,
      operator: validation.operator,
      touched,
      caretIndex,
    }
  }

  const store = createStore<PhoneFieldSnapshot>(
    build(normalizePhoneInput(initialOptions.initialValue ?? "", country), false, null)
  )

  return {
    getSnapshot: store.getState,
    subscribe: store.subscribe,
    input(text, caret) {
      const previous = store.getState()
      const result = applyPhoneEdit(previous.national, { text, caret }, country)
      const next = build(result.national, previous.touched, result.caretIndex)
      store.setState(next)
      onChange?.(next.national, next.validation)
      return next
    },
    setValue(value) {
      const previous = store.getState()
      const national = normalizePhoneInput(value, country)
      if (national === previous.national) return
      const next = build(national, previous.touched, null)
      store.setState(next)
      onChange?.(next.national, next.validation)
    },
    blur() {
      const previous = store.getState()
      if (!previous.touched) store.setState({ ...previous, touched: true })
    },
    setOptions(next) {
      if (next.country !== undefined) country = next.country
      if ("requireOperator" in next) requireOperator = next.requireOperator
      if ("operator" in next) operator = next.operator
      const previous = store.getState()
      store.setState(build(normalizePhoneInput(previous.national, country), previous.touched, null))
    },
  }
}
