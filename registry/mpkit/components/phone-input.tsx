"use client"

import { useCallback, useId, type ComponentProps, type ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { OperatorBadge } from "@/components/mpkit/operator-badge"
import { useCountry, useLocale, useT } from "@/components/mpkit/mpkit-provider"
import { usePhoneField } from "@/hooks/mpkit/use-phone-field"
import type { CountryConfig, Locale } from "@/lib/mpkit/countries/types"
import type { PhoneValidation } from "@/lib/mpkit/phone"
import { phoneErrorMessage } from "@/lib/mpkit/phone-errors"
import { cn } from "@/lib/utils"

/** Parts of the field you can style. Each also has a `data-slot` attribute. */
export interface PhoneInputClassNames {
  label?: string
  /** The box around the input, the +237 prefix and the operator badge. */
  field?: string
  /** The country calling code shown before the number. */
  prefix?: string
  /** The text input itself. */
  input?: string
  /** The box around the operator badge. */
  badge?: string
  hint?: string
  error?: string
}

export interface PhoneInputProps extends Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "size"
> {
  /**
   * The national number as digits, without spaces or country code, e.g.
   * "651234567". An E.164 value such as "+237651234567" is also accepted.
   */
  value?: string
  defaultValue?: string
  /**
   * Called on every change with the national digits and the validation result.
   * `details.e164` is the E.164 number once the number is valid.
   */
  onChange?: (value: string, details: PhoneValidation) => void
  /** Country to use. Defaults to the one in `MpKitProvider`. */
  country?: CountryConfig
  locale?: Locale
  /** Visible label. Pass `false` to hide it, and then provide `aria-label`. */
  label?: string | false
  /** Helper text under the input. Pass `false` to hide it. */
  hint?: string | false
  /** An error message from your form library. Overrides the built-in one. */
  error?: string
  /** Reject numbers whose prefix matches no known operator. */
  requireOperator?: boolean
  /** Id of the operator the number must belong to, e.g. "mtn". */
  operator?: string
  /** Your own logos by operator id, shown in the badge instead of the color dot. */
  operatorLogos?: Record<string, ReactNode>
  /** Class names for parts of the field. `className` styles the outer wrapper. */
  classNames?: PhoneInputClassNames
}

/**
 * A phone number field for a country: groups digits as you type, detects the
 * operator from the prefix, validates the length and gives you the E.164 number.
 *
 * With react-hook-form, use `Controller`, not `register`.
 */
export function PhoneInput({
  value: valueProp,
  defaultValue,
  onChange,
  onBlur,
  country: countryProp,
  locale: localeProp,
  label,
  hint,
  error,
  requireOperator,
  operator: requiredOperator,
  operatorLogos,
  classNames,
  id: idProp,
  name,
  className,
  ref,
  "aria-describedby": describedByProp,
  ...props
}: PhoneInputProps) {
  const country = useCountry(countryProp)
  const locale = useLocale(localeProp)
  const t = useT(locale)

  const generatedId = useId()
  const id = idProp ?? generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  // All the behaviour (grouping, caret, validation, operator) is in the headless hook.
  const field = usePhoneField({
    country,
    value: valueProp,
    defaultValue,
    onChange,
    requireOperator,
    operator: requiredOperator,
  })
  const { national, validation, touched, inputRef } = field
  const detected = validation.operator
  const inputProps = field.getInputProps({ onBlur })

  // The field needs the input element for the caret, and you may want it too.
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [inputRef, ref]
  )

  const builtinError =
    touched && !validation.valid && validation.issue && (national.length > 0 || props.required)
      ? phoneErrorMessage(validation.issue, {
          country,
          locale,
          t,
          operator: requiredOperator,
        })
      : undefined
  const errorMessage = error ?? builtinError

  const visibleHint =
    hint === undefined ? t("phone.hint", { length: country.nationalNumberLength }) : hint
  const describedBy =
    [errorMessage ? errorId : visibleHint ? hintId : undefined, describedByProp]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div data-slot="phone-input" className={cn("space-y-1.5", className)}>
      {label !== false && (
        <label
          htmlFor={id}
          data-slot="phone-input-label"
          className={cn("text-sm leading-none font-medium", classNames?.label)}
        >
          {label ?? t("phone.label")}
        </label>
      )}

      <div data-slot="phone-input-field" className={cn("relative", classNames?.field)}>
        <span
          aria-hidden="true"
          data-slot="phone-input-prefix"
          className={cn(
            "text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm",
            classNames?.prefix
          )}
        >
          +{country.callingCode}
        </span>
        <Input
          {...props}
          {...inputProps}
          ref={setRefs}
          id={id}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={describedBy}
          data-slot="phone-input-input"
          className={cn("pr-28 pl-14", classNames?.input)}
        />
        {detected && (
          <div
            data-slot="phone-input-badge"
            className={cn(
              "pointer-events-none absolute inset-y-0 right-2 flex items-center",
              classNames?.badge
            )}
          >
            <OperatorBadge operator={detected} logo={operatorLogos?.[detected.id]} />
          </div>
        )}
      </div>

      {/* Submits the E.164 number with native forms, whatever the visible grouping. */}
      {name && <input type="hidden" name={name} value={validation.e164 ?? ""} />}

      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          data-slot="phone-input-error"
          className={cn("text-destructive text-sm", classNames?.error)}
        >
          {errorMessage}
        </p>
      ) : (
        visibleHint && (
          <p
            id={hintId}
            data-slot="phone-input-hint"
            className={cn("text-muted-foreground text-xs", classNames?.hint)}
          >
            {visibleHint}
          </p>
        )
      )}

      <span className="sr-only" aria-live="polite">
        {detected ? t("phone.operatorDetected", { operator: detected.name }) : ""}
      </span>
    </div>
  )
}
