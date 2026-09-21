"use client"

import { Banknote, Check, CreditCard, Smartphone } from "lucide-react"
import { useId, useState, type ComponentProps, type ReactNode } from "react"

import { useCountry, useLocale, useT } from "@/components/mboa/mboa-provider"
import { PhoneInput } from "@/components/mboa/phone-input"
import type { CountryConfig, Locale } from "@/lib/mboa/countries/types"
import type { MessageKey } from "@/lib/mboa/i18n"
import {
  defaultPaymentMethods,
  emptySelection,
  resolvePayment,
  type PaymentMethod,
  type PaymentSelection,
  type ResolvedPayment,
} from "@/lib/mboa/payment-methods"
import { cn } from "@/lib/utils"

/** Parts of the picker you can style. Each also has a `data-slot` attribute. */
export interface PaymentMethodPickerClassNames {
  legend?: string
  /** The grid that holds the cards. */
  options?: string
  /** Each card. Style the selected one with `has-[:checked]:...`. */
  option?: string
  /** The name on each card. */
  optionLabel?: string
  /** The description on each card. */
  optionDescription?: string
  /** The wrapper of the phone field that appears for Mobile Money. */
  phone?: string
  error?: string
}

export interface PaymentMethodPickerProps extends Omit<
  ComponentProps<"fieldset">,
  "defaultValue" | "onChange"
> {
  /** Methods to offer. Defaults to Mobile Money for the country's operators, card and cash. */
  methods?: PaymentMethod[]
  /** The current choice. Makes the picker controlled. */
  value?: PaymentSelection
  defaultValue?: PaymentSelection
  /**
   * Called when the method or the phone number changes. `resolved` tells you
   * whether the selection is ready to pay and gives the E.164 number.
   */
  onChange?: (selection: PaymentSelection, resolved: ResolvedPayment) => void
  country?: CountryConfig
  locale?: Locale
  /** Group label. Defaults to "Payment method". */
  legend?: string
  /** Error to show under the cards, for example "Choose a payment method". */
  error?: string
  /** Error for the phone field of the chosen Mobile Money method. Overrides its built-in error. */
  phoneError?: string
  /** Your own logos by operator id, shown instead of the color dot. */
  operatorLogos?: Record<string, ReactNode>
  /** Class names for parts of the picker. `className` styles the fieldset. */
  classNames?: PaymentMethodPickerClassNames
}

const icons = { card: CreditCard, cash: Banknote, mobile_money: Smartphone } as const

const labelKeys: Record<"card" | "cash", MessageKey> = {
  card: "picker.card",
  cash: "picker.cash",
}
const descriptionKeys: Record<PaymentMethod["kind"], MessageKey> = {
  mobile_money: "picker.mobileMoneyDescription",
  card: "picker.cardDescription",
  cash: "picker.cashDescription",
}

/**
 * Selectable cards for Mobile Money operators, card and cash. Choosing a Mobile
 * Money option reveals a phone input for that operator right under the cards.
 *
 * Built on native radio inputs, so arrow keys, a single tab stop and screen
 * reader semantics work without any custom key handling.
 */
export function PaymentMethodPicker({
  methods: methodsProp,
  value: valueProp,
  defaultValue,
  onChange,
  country: countryProp,
  locale: localeProp,
  legend,
  error,
  phoneError,
  operatorLogos,
  classNames,
  disabled,
  className,
  ...props
}: PaymentMethodPickerProps) {
  const country = useCountry(countryProp)
  const locale = useLocale(localeProp)
  const t = useT(locale)

  const groupName = useId()
  const errorId = useId()
  const methods = methodsProp ?? defaultPaymentMethods(country)

  const isControlled = valueProp !== undefined
  const [innerValue, setInnerValue] = useState<PaymentSelection>(defaultValue ?? emptySelection)
  const selection = isControlled ? valueProp : innerValue
  const resolved = resolvePayment(selection, methods, country)

  function update(next: PaymentSelection) {
    if (!isControlled) setInnerValue(next)
    onChange?.(next, resolvePayment(next, methods, country))
  }

  const operator = resolved.operator

  return (
    <fieldset
      data-slot="payment-method-picker"
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
      className={cn("min-w-0 space-y-3", className)}
      {...props}
    >
      <legend
        data-slot="payment-method-picker-legend"
        className={cn("mb-2 text-sm font-medium", classNames?.legend)}
      >
        {legend ?? t("picker.legend")}
      </legend>

      <div
        data-slot="payment-method-picker-options"
        className={cn("grid gap-2 sm:grid-cols-2", classNames?.options)}
      >
        {methods.map((method) => {
          const methodOperator = country.operators.find((item) => item.id === method.operatorId)
          const Icon = icons[method.kind]
          const label =
            method.label ??
            (method.kind === "mobile_money"
              ? (methodOperator?.mobileMoneyName ?? methodOperator?.name ?? method.id)
              : t(labelKeys[method.kind]))
          const description = method.description ?? t(descriptionKeys[method.kind])

          return (
            <label
              key={method.id}
              data-slot="payment-method-picker-option"
              className={cn(
                "group/option bg-background flex cursor-pointer items-start gap-3 rounded-lg border p-3.5",
                "motion-safe:transition-[border-color,background-color,box-shadow,transform] motion-safe:duration-200",
                "hover:bg-muted/50 motion-safe:active:scale-[0.99]",
                "has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-primary has-[:checked]:ring-1",
                "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-3",
                "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
                classNames?.option
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={method.id}
                checked={selection.methodId === method.id}
                onChange={() => update({ ...selection, methodId: method.id })}
                className="sr-only"
              />
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center" aria-hidden>
                {method.kind === "mobile_money" && methodOperator ? (
                  (operatorLogos?.[methodOperator.id] ?? (
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: methodOperator.color }}
                    />
                  ))
                ) : (
                  <Icon className="text-muted-foreground size-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  data-slot="payment-method-picker-option-label"
                  className={cn("block text-sm leading-tight font-medium", classNames?.optionLabel)}
                >
                  {label}
                </span>
                <span
                  data-slot="payment-method-picker-option-description"
                  className={cn(
                    "text-muted-foreground block text-xs",
                    classNames?.optionDescription
                  )}
                >
                  {description}
                </span>
              </span>
              {/* A tick that pops in when the card is chosen, so the choice is clear. */}
              <span
                aria-hidden="true"
                className="border-input text-primary-foreground group-has-[:checked]/option:border-primary group-has-[:checked]/option:bg-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border motion-safe:transition-colors motion-safe:duration-200"
              >
                <Check className="size-3 scale-0 group-has-[:checked]/option:scale-100 motion-safe:transition-transform motion-safe:duration-200" />
              </span>
            </label>
          )
        })}
      </div>

      {resolved.method?.kind === "mobile_money" && operator && (
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200">
          <PhoneInput
            country={country}
            locale={locale}
            label={t("picker.phoneLabel", { operator: operator.name })}
            operator={operator.id}
            operatorLogos={operatorLogos}
            className={classNames?.phone}
            error={phoneError}
            value={selection.phone}
            onChange={(phone) => update({ ...selection, phone })}
            disabled={disabled}
          />
        </div>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          data-slot="payment-method-picker-error"
          className={cn("text-destructive text-sm", classNames?.error)}
        >
          {error}
        </p>
      )}
    </fieldset>
  )
}
