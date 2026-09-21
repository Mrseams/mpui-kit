"use client"

import { CircleAlert, Clock } from "lucide-react"
import {
  useCallback,
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
import type { MethodPanel } from "@/components/mboa/method-panel"
import { useCountry, useLocale, useT } from "@/components/mboa/mboa-provider"
import { PaymentMethodPicker } from "@/components/mboa/payment-method-picker"
import { ReceiptCard, type ReceiptDetail } from "@/components/mboa/receipt-card"
import { UssdPrompt } from "@/components/mboa/ussd-prompt"
import { useMomoCheckout, type UseMomoCheckoutOptions } from "@/hooks/mboa/use-momo-checkout"
import type { CheckoutStatus, PaymentReceipt } from "@/lib/mboa/checkout-machine"
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

/** Parts of the checkout you can style. Each also has a `data-slot` attribute. */
export interface MomoCheckoutClassNames {
  /** The heading. */
  title?: string
  /** The summary under the heading. */
  summary?: string
  /** The row with the total. */
  total?: string
  /** The amount in the total row. */
  amount?: string
  /** The form around the method cards and the Pay button. */
  form?: string
  /** The Pay button. */
  submit?: string
  /** The payment method picker. */
  picker?: string
  /** The USSD prompt shown while waiting for approval. */
  prompt?: string
  /** The Cancel button shown while waiting. */
  cancel?: string
  /** The receipt after a successful payment. */
  receipt?: string
  /** The panel shown after a failure or a timeout. */
  failure?: string
  /** The row under the Pay button, from `footer`. */
  footer?: string
}

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
  /**
   * Your own panel for a payment method, by method id: where you host your
   * payment provider's card fields or buttons (Stripe, PayPal, ...). It replaces
   * the built-in content for that method. Card details never enter mboa-ui;
   * the panel hands back an opaque token that reaches `onPay` as `payload`.
   * See `MethodPanel`.
   */
  panels?: Record<string, MethodPanel>
  /** Your own icons by method id, for example a wallet's logo. mboa-ui ships no brand logos. */
  methodIcons?: Record<string, ReactNode>
  /** Text for the Pay button. Defaults to "Pay {amount}". */
  submitLabel?: string
  /** Disables the Pay button, for example until the customer accepts your terms. */
  submitDisabled?: boolean
  /** Shown under the Pay button, for example a link to your terms or a security note. */
  footer?: ReactNode
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
  /**
   * Called whenever the checkout moves to a new state. Use it to lock the rest
   * of your page, for example the order, while a payment is in progress.
   */
  onStatusChange?: (status: CheckoutStatus) => void
  country?: CountryConfig
  locale?: Locale
  /** Your own operator logos by operator id, shown instead of the color dot. */
  operatorLogos?: Record<string, ReactNode>
  /** Class names for parts of the checkout. `className` styles the root. */
  classNames?: MomoCheckoutClassNames
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
  panels,
  methodIcons,
  submitLabel,
  submitDisabled,
  footer,
  receiptDetails,
  failureMessages,
  onSuccess,
  onFailure,
  onDone,
  onStatusChange,
  country: countryProp,
  locale: localeProp,
  operatorLogos,
  classNames,
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
  const { state, payment } = checkout
  // While a payment is in progress, show the amount the customer pressed Pay
  // on, even if the `amount` prop changes meanwhile.
  const inProgress = state.status !== "idle" && payment !== null
  const shownAmount = inProgress ? payment.amount : amount
  const shownCurrency = inProgress ? payment.currency : currency

  const [selection, setSelection] = useState<PaymentSelection>(emptySelection)
  const [attempted, setAttempted] = useState(false)
  const resolved = resolvePayment(selection, methods, country)

  // The state of the selected method's panel, if it has one. The panel reports
  // it through the callbacks below; card details themselves never come here.
  const panel = resolved.method ? panels?.[resolved.method.id] : undefined
  const [panelState, setPanelState] = useState<{ ready: boolean; error?: string }>({
    ready: false,
  })
  const [collecting, setCollecting] = useState(false)
  const collectRef = useRef<(() => Promise<unknown>) | null>(null)

  const setPanelReady = useCallback(
    (ready: boolean) => {
      setPanelState((previous) => (previous.ready === ready ? previous : { ...previous, ready }))
    },
    [setPanelState]
  )
  const setPanelError = useCallback(
    (error: string | undefined) => {
      setPanelState((previous) => (previous.error === error ? previous : { ...previous, error }))
    },
    [setPanelState]
  )
  const setPanelCollect = useCallback((collect: (() => Promise<unknown>) | null) => {
    collectRef.current = collect
  }, [])

  const titleId = useId()
  const resultTitleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLElement>(null)

  const callbacks = useRef({ onSuccess, onFailure, onStatusChange })
  useEffect(() => {
    callbacks.current = { onSuccess, onFailure, onStatusChange }
  })

  // Tell the app about results once, and move focus to where the user's
  // attention should go: the result, or back to the method cards after a reset.
  const previousStatus = useRef(state.status)
  useEffect(() => {
    const previous = previousStatus.current
    previousStatus.current = state.status
    if (state.status === previous) return

    callbacks.current.onStatusChange?.(state.status)
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

  // What a panel that submits by itself needs: the latest method and `pay`.
  const latest = useRef({ methodId: resolved.method?.id, pay: checkout.pay })
  useEffect(() => {
    latest.current = { methodId: resolved.method?.id, pay: checkout.pay }
  })
  const submitFromPanel = useCallback((payload?: unknown) => {
    const { methodId, pay } = latest.current
    if (methodId) pay({ methodId, payload })
  }, [])

  function handleMethodChange(next: PaymentSelection) {
    if (next.methodId !== selection.methodId) {
      // A different method has its own panel: start it clean.
      collectRef.current = null
      setPanelState({ ready: false })
    }
    setSelection(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (collecting) return
    setAttempted(true)
    if (!resolved.method) {
      rootRef.current?.querySelector<HTMLElement>('input[type="radio"]')?.focus()
      return
    }

    if (panel) {
      // The panel replaces the built-in fields, so it decides when we are ready.
      if (!panelState.ready) return
      const methodId = resolved.method.id
      let payload: unknown
      if (collectRef.current) {
        setCollecting(true)
        setPanelError(undefined)
        try {
          payload = await collectRef.current()
        } catch {
          setCollecting(false)
          // Keep the panel's own message if it gave one; otherwise say something generic.
          setPanelState((previous) =>
            previous.error ? previous : { ...previous, error: t("checkout.paymentDetailsError") }
          )
          return
        }
        setCollecting(false)
        // The customer may have changed method while the token was being made.
        if (latest.current.methodId !== methodId) return
      }
      checkout.pay({ methodId, payload })
      return
    }

    if (!resolved.ready) {
      // Send the user to the first thing that needs fixing.
      rootRef.current?.querySelector<HTMLElement>('input[type="tel"]')?.focus()
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
        <h2
          id={titleId}
          data-slot="momo-checkout-title"
          className={cn("text-lg font-semibold", classNames?.title)}
        >
          {title ?? t("checkout.title")}
        </h2>
        {summary && (
          <div
            data-slot="momo-checkout-summary"
            className={cn("text-muted-foreground text-sm", classNames?.summary)}
          >
            {summary}
          </div>
        )}
        <div
          data-slot="momo-checkout-total"
          className={cn(
            "flex items-baseline justify-between gap-4 border-y py-3",
            classNames?.total
          )}
        >
          <span className="text-muted-foreground text-sm">{t("checkout.total")}</span>
          <Currency
            amount={shownAmount}
            currency={shownCurrency}
            locale={locale}
            data-slot="momo-checkout-amount"
            className={cn("text-2xl font-semibold", classNames?.amount)}
          />
        </div>
      </div>

      {state.status === "idle" && (
        <form
          onSubmit={handleSubmit}
          noValidate
          data-slot="momo-checkout-form"
          className={cn(
            "motion-safe:animate-in motion-safe:fade-in space-y-4 motion-safe:duration-200",
            classNames?.form
          )}
        >
          <PaymentMethodPicker
            className={classNames?.picker}
            country={country}
            locale={locale}
            methods={methods}
            value={selection}
            onChange={handleMethodChange}
            error={methodError}
            phoneError={phoneError}
            operatorLogos={operatorLogos}
            methodIcons={methodIcons}
            disabled={collecting}
            renderPanel={(method) => {
              const methodPanel = panels?.[method.id]
              if (!methodPanel) return undefined
              const PanelComponent = methodPanel.component
              const message =
                panelState.error ??
                (attempted && !panelState.ready ? t("checkout.completePayment") : undefined)
              return (
                <div data-slot="momo-checkout-panel" className="space-y-2">
                  <PanelComponent
                    key={method.id}
                    method={method}
                    amount={amount}
                    currency={currency}
                    locale={locale}
                    country={country}
                    disabled={collecting}
                    setReady={setPanelReady}
                    setCollect={setPanelCollect}
                    submit={submitFromPanel}
                    setError={setPanelError}
                  />
                  {message && (
                    <p role="alert" className="text-destructive text-sm">
                      {message}
                    </p>
                  )}
                </div>
              )
            }}
          />
          {panel?.submit !== "panel" && (
            <Button
              type="submit"
              size="lg"
              disabled={submitDisabled || collecting}
              data-slot="momo-checkout-submit"
              className={cn("w-full", classNames?.submit)}
            >
              {submitLabel ??
                t("checkout.pay", { amount: formatFcfa(amount, { locale, currency }) })}
            </Button>
          )}
          {footer && (
            <div
              data-slot="momo-checkout-footer"
              className={cn("text-muted-foreground text-center text-xs", classNames?.footer)}
            >
              {footer}
            </div>
          )}
        </form>
      )}

      {state.status === "awaiting_approval" && (
        <div className="space-y-4">
          {resolved.method?.kind === "mobile_money" ? (
            <UssdPrompt
              key={state.attempt}
              className={classNames?.prompt}
              country={country}
              locale={locale}
              code={state.ussdCode}
              phone={resolved.e164 ?? undefined}
              expiresAt={state.expiresAt}
              durationMs={state.timeoutMs}
            />
          ) : (
            <p role="status" className="text-sm font-medium">
              {t("checkout.sending")}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            data-slot="momo-checkout-cancel"
            className={classNames?.cancel}
            onClick={checkout.cancel}
          >
            {t("checkout.cancel")}
          </Button>
        </div>
      )}

      {state.status === "success" && (
        <ReceiptCard
          ref={resultRef}
          tabIndex={-1}
          className={classNames?.receipt}
          country={country}
          locale={locale}
          receipt={state.receipt}
          methodLabel={methods.find((method) => method.id === state.receipt.methodId)?.label}
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
          data-slot="momo-checkout-failure"
          className={cn(
            "border-destructive/40 bg-destructive/5 space-y-4 rounded-lg border p-5 text-center",
            "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300",
            classNames?.failure
          )}
        >
          <span
            aria-hidden="true"
            className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full"
          >
            {state.status === "failed" ? (
              <CircleAlert className="size-7" />
            ) : (
              <Clock className="size-7" />
            )}
          </span>
          <div className="space-y-1.5">
            <h3 id={resultTitleId} className="font-medium">
              {state.status === "failed" ? t("checkout.failedTitle") : t("checkout.timeoutTitle")}
            </h3>
            <p className="text-sm text-pretty">
              {state.status === "failed"
                ? (failureMessages?.[state.reason ?? ""] ?? t("checkout.failedBody"))
                : t("checkout.timeoutBody")}
            </p>
            {state.status === "timeout" && (
              <p className="text-muted-foreground text-sm text-pretty">
                {t("checkout.timeoutNote")}
              </p>
            )}
          </div>
          {/* Two equal buttons, side by side. */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              className="h-auto min-h-10 w-full py-2 leading-tight whitespace-normal"
              onClick={checkout.retry}
            >
              {t("checkout.retry")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-10 w-full py-2 leading-tight whitespace-normal"
              onClick={checkout.reset}
            >
              {t("checkout.changeMethod")}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
