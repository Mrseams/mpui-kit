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
  /** The checkmark icon. */
  icon?: string
  title?: string
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

/** A confirmation card for a successful payment: amount, method, reference and date. */
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
      className={cn("bg-card space-y-4 rounded-lg border p-4", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <CircleCheck
          data-slot="receipt-card-icon"
          // Uses your --success color if you define one, otherwise your primary color.
          className={cn(
            "size-6 shrink-0 text-[color:var(--success,var(--primary))]",
            classNames?.icon
          )}
          aria-hidden
        />
        <h3
          id={titleId}
          data-slot="receipt-card-title"
          className={cn("font-semibold", classNames?.title)}
        >
          {t("receipt.title")}
        </h3>
      </div>

      <dl
        data-slot="receipt-card-list"
        className={cn("grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm", classNames?.list)}
      >
        <dt className="text-muted-foreground">{t("receipt.amount")}</dt>
        <dd className="font-semibold">
          <Currency amount={receipt.amount} currency={receipt.currency} locale={locale} />
        </dd>

        <dt className="text-muted-foreground">{t("receipt.method")}</dt>
        <dd>{paymentMethodLabel(receipt.methodId, country, t)}</dd>

        {phoneText && (
          <>
            <dt className="text-muted-foreground">{t("receipt.phone")}</dt>
            <dd>{phoneText}</dd>
          </>
        )}

        <dt className="text-muted-foreground">{t("receipt.reference")}</dt>
        <dd className="font-mono break-all">{receipt.reference}</dd>

        <dt className="text-muted-foreground">{t("receipt.date")}</dt>
        <dd>{formatDateTime(receipt.paidAt, locale)}</dd>

        {details?.map((detail) => (
          <div key={detail.label} className="contents">
            <dt className="text-muted-foreground">{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>

      {onDone && (
        <Button
          type="button"
          data-slot="receipt-card-done"
          className={classNames?.done}
          onClick={onDone}
        >
          {t("receipt.done")}
        </Button>
      )}
    </section>
  )
}
