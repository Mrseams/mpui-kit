"use client"

import { CircleCheck } from "lucide-react"
import { useId, type ComponentProps, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Currency } from "@/components/mboa/currency"
import { useCountry, useLocale, useT } from "@/components/mboa/mboa-provider"
import type { PaymentReceipt } from "@/lib/mboa/checkout-machine"
import type { CountryConfig, Locale } from "@/lib/mboa/countries/types"
import { formatDateTime } from "@/lib/mboa/format-date"
import { paymentMethodLabel } from "@/lib/mboa/payment-methods"
import { formatInternational, validatePhone } from "@/lib/mboa/phone"
import { cn } from "@/lib/utils"

export interface ReceiptDetail {
  label: string
  value: ReactNode
}

/** Parts of the receipt you can style. Each also has a `data-slot` attribute. */
export interface ReceiptCardClassNames {
  /** The round badge with the checkmark. */
  icon?: string
  title?: string
  /** The amount, shown large under the title. */
  amount?: string
  /** The list of rows. */
  list?: string
  /** The Done button. */
  done?: string
}

export interface ReceiptCardProps extends Omit<ComponentProps<"section">, "children"> {
  receipt: PaymentReceipt
  /** Extra rows, for example what was bought. Shown after the payment details. */
  details?: ReceiptDetail[]
  /** Adds a "Done" button that calls this. */
  onDone?: () => void
  country?: CountryConfig
  locale?: Locale
  /** Class names for parts of the card. `className` styles the root. */
  classNames?: ReceiptCardClassNames
}

/**
 * A confirmation card for a successful payment: a checkmark, the amount, and
 * the method, reference and date. It eases in, and the checkmark pops, unless
 * the user has asked for reduced motion.
 */
export function ReceiptCard({
  receipt,
  details,
  onDone,
  country: countryProp,
  locale: localeProp,
  classNames,
  className,
  ...props
}: ReceiptCardProps) {
  const country = useCountry(countryProp)
  const locale = useLocale(localeProp)
  const t = useT(locale)
  const titleId = useId()

  const phone = receipt.phone ? validatePhone(receipt.phone, country) : null
  const phoneText = phone?.valid ? formatInternational(phone.national, country) : receipt.phone

  return (
    <section
      data-slot="receipt-card"
      aria-labelledby={titleId}
      className={cn(
        "bg-card space-y-5 rounded-lg border p-5",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300",
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          aria-hidden="true"
          data-slot="receipt-card-icon"
          // Uses your --success color if you define one, otherwise your primary color.
          className={cn(
            "flex size-14 items-center justify-center rounded-full",
            "bg-[color-mix(in_oklab,var(--success,var(--primary))_12%,transparent)]",
            "text-[color:var(--success,var(--primary))]",
            "motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:delay-100 motion-safe:duration-500",
            classNames?.icon
          )}
        >
          <CircleCheck className="size-8" />
        </span>
        <h3
          id={titleId}
          data-slot="receipt-card-title"
          className={cn("font-semibold", classNames?.title)}
        >
          {t("receipt.title")}
        </h3>
        <p
          data-slot="receipt-card-amount"
          className={cn("text-3xl font-semibold tabular-nums", classNames?.amount)}
        >
          <span className="sr-only">{t("receipt.amount")}: </span>
          <Currency amount={receipt.amount} currency={receipt.currency} locale={locale} />
        </p>
      </div>

      <dl
        data-slot="receipt-card-list"
        className={cn("divide-y border-y text-sm", classNames?.list)}
      >
        <Row label={t("receipt.method")}>{paymentMethodLabel(receipt.methodId, country, t)}</Row>
        {phoneText && <Row label={t("receipt.phone")}>{phoneText}</Row>}
        <Row label={t("receipt.reference")} mono>
          {receipt.reference}
        </Row>
        <Row label={t("receipt.date")}>{formatDateTime(receipt.paidAt, locale)}</Row>
        {details?.map((detail) => (
          <Row key={detail.label} label={detail.label}>
            {detail.value}
          </Row>
        ))}
      </dl>

      {onDone && (
        <Button
          type="button"
          data-slot="receipt-card-done"
          className={cn("h-10 w-full", classNames?.done)}
          onClick={onDone}
        >
          {t("receipt.done")}
        </Button>
      )}
    </section>
  )
}

/** One line of the receipt: the label on the left, the value on the right. */
function Row({ label, mono, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-medium", mono && "font-mono text-xs break-all")}>
        {children}
      </dd>
    </div>
  )
}
