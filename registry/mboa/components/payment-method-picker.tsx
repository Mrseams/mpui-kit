"use client"

import { Banknote, CreditCard, Smartphone } from "lucide-react"
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
  /** Your own logos by operator id, shown instead of the color dot. */
  operatorLogos?: Record<string, ReactNode>
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
  operatorLogos,
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
      <legend className="mb-2 text-sm font-medium">{legend ?? t("picker.legend")}</legend>

      <div className="grid gap-2 sm:grid-cols-2">
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
              className={cn(
                "bg-background flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                "hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5",
                "has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-3",
                "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
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
              <span className="min-w-0">
                <span className="block text-sm leading-tight font-medium">{label}</span>
                <span className="text-muted-foreground block text-xs">{description}</span>
              </span>
            </label>
          )
        })}
      </div>

      {resolved.method?.kind === "mobile_money" && operator && (
        <PhoneInput
          country={country}
          locale={locale}
          label={t("picker.phoneLabel", { operator: operator.name })}
          operator={operator.id}
          operatorLogos={operatorLogos}
          value={selection.phone}
          onChange={(phone) => update({ ...selection, phone })}
          disabled={disabled}
        />
      )}

      {error && (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
    </fieldset>
  )
}
