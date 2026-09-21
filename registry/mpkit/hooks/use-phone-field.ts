"use client"

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react"

import type { CountryConfig, OperatorConfig } from "@/lib/mpkit/countries/types"
import { applyPhoneEdit } from "@/lib/mpkit/core/phone-field"
import {
  caretIndexAfterDigits,
  formatNational,
  normalizePhoneInput,
  validatePhone,
  type PhoneValidation,
} from "@/lib/mpkit/phone"

export interface UsePhoneFieldOptions {
  country: CountryConfig
  /** The number, as national digits or E.164. Makes the field controlled. */
  value?: string
  /** Initial number for an uncontrolled field. */
  defaultValue?: string
  /** Called on every change with the national digits and the validation result. */
  onChange?: (national: string, validation: PhoneValidation) => void
  /** Reject numbers whose prefix matches no known operator. */
  requireOperator?: boolean
  /** Id of the operator the number must belong to, e.g. "mtn". */
  operator?: string
}

/** Props to spread on any `<input>`, including your own Input component. */
export interface PhoneFieldInputProps {
  ref: (node: HTMLInputElement | null) => void
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur: (event: FocusEvent<HTMLInputElement>) => void
  type: "tel"
  inputMode: "tel"
  autoComplete: "tel-national"
}

export interface UsePhoneField {
  /** The national number as digits. */
  national: string
  /** The number grouped for display, for example "6 51 23 45 67". */
  formatted: string
  validation: PhoneValidation
  /** The operator detected from the prefix, even while the number is incomplete. */
  operator: OperatorConfig | null
  /** True once the field has lost focus, so you know when to start showing errors. */
  touched: boolean
  /**
   * The hook's own ref for the text input. `getInputProps` already includes it.
   * If you also need a ref of your own, set both from one callback ref.
   */
  inputRef: (node: HTMLInputElement | null) => void
  /** Props for the text input. Pass your own `onBlur` here, so it is called as well. */
  getInputProps: (extra?: {
    onBlur?: (event: FocusEvent<HTMLInputElement>) => void
  }) => PhoneFieldInputProps
}

/**
 * A headless phone field: all the behaviour of PhoneInput with none of its
 * markup. It groups digits as you type, keeps the caret next to the digit you
 * are editing, deletes a digit when Backspace lands on a space, detects the
 * operator and validates. Build any UI on it.
 *
 * @example
 * const field = usePhoneField({ country: cm })
 * <MyInput {...field.getInputProps()} />
 * {field.operator && <Badge>{field.operator.name}</Badge>}
 */
export function usePhoneField(options: UsePhoneFieldOptions): UsePhoneField {
  const { country, value, defaultValue, onChange, requireOperator, operator } = options

  const isControlled = value !== undefined
  const [innerValue, setInnerValue] = useState(() =>
    normalizePhoneInput(defaultValue ?? "", country)
  )
  const [touched, setTouched] = useState(false)

  const national = normalizePhoneInput(isControlled ? value : innerValue, country)
  const formatted = formatNational(national, country)
  const validation = validatePhone(national, country, { requireOperator, operator })

  const inputElement = useRef<HTMLInputElement | null>(null)
  const pendingCaretDigits = useRef<number | null>(null)

  // After digits are re-grouped, put the caret back after the same digit.
  useLayoutEffect(() => {
    const input = inputElement.current
    const digits = pendingCaretDigits.current
    pendingCaretDigits.current = null
    if (input && digits !== null && document.activeElement === input) {
      const position = caretIndexAfterDigits(input.value, digits)
      input.setSelectionRange(position, position)
    }
  })

  const inputRef = useCallback((node: HTMLInputElement | null) => {
    inputElement.current = node
  }, [])

  function getInputProps(extra: Parameters<UsePhoneField["getInputProps"]>[0] = {}) {
    return {
      ref: inputRef,
      value: formatted,
      type: "tel" as const,
      inputMode: "tel" as const,
      autoComplete: "tel-national" as const,
      onChange(event: ChangeEvent<HTMLInputElement>) {
        const { value: text, selectionStart } = event.target
        const result = applyPhoneEdit(
          national,
          { text, caret: selectionStart ?? text.length },
          country
        )
        pendingCaretDigits.current = result.caretDigits
        if (!isControlled) setInnerValue(result.national)
        onChange?.(
          result.national,
          validatePhone(result.national, country, { requireOperator, operator })
        )
      },
      onBlur(event: FocusEvent<HTMLInputElement>) {
        setTouched(true)
        extra.onBlur?.(event)
      },
    }
  }

  return {
    national,
    formatted,
    validation,
    operator: validation.operator,
    touched,
    inputRef,
    getInputProps,
  }
}
