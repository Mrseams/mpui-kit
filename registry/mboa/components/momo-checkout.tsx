"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react"

import { Button } from "@/components/ui/button"
import { Currency } from "@/components/mboa/currency"
import { useCountry, useLocale, useT } from "@/components/mboa/mboa-provider"
import { PaymentMethodPicker } from "@/components/mboa/payment-method-picker"
import { ReceiptCard, type ReceiptDetail } from "@/components/mboa/receipt-card"
import { UssdPrompt } from "@/components/mboa/ussd-prompt"
import { useMomoCheckout, type UseMomoCheckoutOptions } from "@/hooks/mboa/use-momo-checkout"
import type { PaymentReceipt } from "@/lib/mboa/checkout-machine"
import type { CountryConfig, CurrencyCode, Locale } from "@/lib/mboa/countries/types"
import { formatFcfa } from "@/lib/mboa/format-fcfa"
import {
  defaultPaymentMethods,
  emptySelection,
  resolvePayment,
  type PaymentMethod,
  type PaymentSelection,
} from "@/lib/mboa/payment-methods"
import { phoneErrorMessage } from "@/lib/mboa/phone-errors"
import { cn } from "@/lib/utils"

export interface MomoCheckoutProps
  extends
    Omit<ComponentProps<"div">, "children" | "title">,
    Pick<UseMomoCheckoutOptions, "onPay" | "onCheckStatus" | "timeoutMs" | "pollIntervalMs"> {
  /** Amount to pay, in CFA francs. */
  amount: number
  /** CFA franc zone. Defaults to the country's currency. */
  currency?: CurrencyCode
  /** Heading. Defaults to "Checkout". */
  title?: string
  /** What is being paid for, shown under the heading, for example a booking summary. */
  summary?: ReactNode
  /** Payment methods to offer. Defaults to the country's Mobile Money operators, card and cash. */
  methods?: PaymentMethod[]
  /** Extra rows on the receipt, for example what was bought. */
  receiptDetails?: ReceiptDetail[]
  /**
   * Messages for failure reasons your backend returns, by reason. A reason that
   * is not listed shows a generic message: raw backend text is never shown.
   */
  failureMessages?: Record<string, string>
  /** Called once when a payment succeeds. */
  onSuccess?: (receipt: PaymentReceipt) => void
  /** Called once when a payment fails, with the reason from your backend. Not called on timeout. */
  onFailure?: (reason?: string) => void
  /** Called when the user presses "Done" on the receipt. The checkout then starts over. */
  onDone?: () => void
  country?: CountryConfig
  locale?: Locale
  /** Your own operator logos by operator id, shown instead of the color dot. */
  operatorLogos?: Record<string, ReactNode>
}

/**
 * A complete Mobile Money checkout: choose a method, enter a number, approve on
 * the phone, then see a receipt. It moves through idle, awaiting approval, and
 * success, failed or timeout.
 *
 * It never talks to a payment provider itself. You provide `onPay` (and
 * `onCheckStatus` to poll) and it does the rest.
 */
export function MomoCheckout({
  amount,
  currency: currencyProp,
  onPay,
  onCheckStatus,
  timeoutMs,
  pollIntervalMs,
  title,
  summary,
  methods: methodsProp,
  receiptDetails,
  failureMessages,
  onSuccess,
  onFailure,
  onDone,
  country: countryProp,
  locale: localeProp,
  operatorLogos,
  className,
  ...props
}: MomoCheckoutProps) {
  const country = useCountry(countryProp)
  const locale = useLocale(localeProp)
  const t = useT(locale)
  const currency = currencyProp ?? country.currency
  const methods = methodsProp ?? defaultPaymentMethods(country)

  const checkout = useMomoCheckout({
    amount,
    currency,
    onPay,
    onCheckStatus,
    timeoutMs,
    pollIntervalMs,
  })
  const { state } = checkout

  const [selection, setSelection] = useState<PaymentSelection>(emptySelection)
  const [attempted, setAttempted] = useState(false)
  const resolved = resolvePayment(selection, methods, country)

  const titleId = useId()
  const resultTitleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLElement>(null)

  const callbacks = useRef({ onSuccess, onFailure })
  useEffect(() => {
    callbacks.current = { onSuccess, onFailure }
  })

  // Tell the app about results once, and move focus to where the user's
  // attention should go: the result, or back to the method cards after a reset.
  const previousStatus = useRef(state.status)
  useEffect(() => {
    const previous = previousStatus.current
    previousStatus.current = state.status
    if (state.status === previous) return

    if (state.status === "success") callbacks.current.onSuccess?.(state.receipt)
    if (state.status === "failed") callbacks.current.onFailure?.(state.reason)

    if (state.status === "success" || state.status === "failed" || state.status === "timeout") {
      resultRef.current?.focus()
    } else if (state.status === "idle") {
      const radios = rootRef.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
      const target = Array.from(radios ?? []).find((radio) => radio.checked) ?? radios?.[0]
      target?.focus()
    }
  }, [state])

  const methodError = attempted && !resolved.method ? t("checkout.selectMethod") : undefined
  const phone = resolved.phone
  const phoneError =
    attempted && phone && !phone.valid && phone.issue
      ? phoneErrorMessage(phone.issue, {
          country,
          locale,
          t,
          operator: resolved.method?.operatorId,
        })
      : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setAttempted(true)
    if (!resolved.method || !resolved.ready) {
      // Send the user to the first thing that needs fixing.
      const invalid = resolved.method ? 'input[type="tel"]' : 'input[type="radio"]'
      rootRef.current?.querySelector<HTMLElement>(invalid)?.focus()
      return
    }
    checkout.pay({ methodId: resolved.method.id, phone: resolved.e164 ?? undefined })
  }

  function handleDone() {
    checkout.reset()
    setSelection(emptySelection)
    setAttempted(false)
    onDone?.()
  }

  return (
    <div
      ref={rootRef}
      data-slot="momo-checkout"
      data-state={state.status}
      role="region"
      aria-labelledby={titleId}
      className={cn("bg-card space-y-4 rounded-xl border p-4 sm:p-6", className)}
      {...props}
    >
      <div className="space-y-3">
        <h2 id={titleId} className="text-lg font-semibold">
          {title ?? t("checkout.title")}
        </h2>
        {summary && <div className="text-muted-foreground text-sm">{summary}</div>}
        <div className="flex items-baseline justify-between gap-4 border-y py-3">
          <span className="text-muted-foreground text-sm">{t("checkout.total")}</span>
          <Currency
            amount={amount}
            currency={currency}
            locale={locale}
            className="text-2xl font-semibold"
          />
        </div>
      </div>

      {state.status === "idle" && (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <PaymentMethodPicker
            country={country}
            locale={locale}
            methods={methods}
            value={selection}
            onChange={(next) => setSelection(next)}
            error={methodError}
            phoneError={phoneError}
            operatorLogos={operatorLogos}
          />
          <Button type="submit" size="lg" className="w-full">
            {t("checkout.pay", { amount: formatFcfa(amount, { locale, currency }) })}
          </Button>
        </form>
      )}

      {state.status === "awaiting_approval" && (
        <div className="space-y-4">
          {resolved.method?.kind === "mobile_money" ? (
            <UssdPrompt
              key={state.attempt}
              country={country}
              locale={locale}
              code={state.ussdCode}
              phone={resolved.e164 ?? undefined}
              expiresAt={state.expiresAt}
            />
          ) : (
            <p role="status" className="text-sm font-medium">
              {t("checkout.sending")}
            </p>
          )}
          <Button type="button" variant="outline" onClick={checkout.cancel}>
            {t("checkout.cancel")}
          </Button>
        </div>
      )}

      {state.status === "success" && (
        <ReceiptCard
          ref={resultRef}
          tabIndex={-1}
          country={country}
          locale={locale}
          receipt={state.receipt}
          details={receiptDetails}
          onDone={handleDone}
        />
      )}

      {(state.status === "failed" || state.status === "timeout") && (
        <section
          ref={resultRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby={resultTitleId}
          className="border-destructive/40 bg-destructive/5 space-y-3 rounded-lg border p-4"
        >
          <h3 id={resultTitleId} className="font-medium">
            {state.status === "failed" ? t("checkout.failedTitle") : t("checkout.timeoutTitle")}
          </h3>
          <p className="text-sm">
            {state.status === "failed"
              ? (failureMessages?.[state.reason ?? ""] ?? t("checkout.failedBody"))
              : t("checkout.timeoutBody")}
          </p>
          {state.status === "timeout" && (
            <p className="text-muted-foreground text-sm">{t("checkout.timeoutNote")}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={checkout.retry}>
              {t("checkout.retry")}
            </Button>
            <Button type="button" variant="outline" onClick={checkout.reset}>
              {t("checkout.changeMethod")}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
