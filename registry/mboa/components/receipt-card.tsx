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

export interface ReceiptCardProps extends Omit<ComponentProps<"section">, "children"> {
  receipt: PaymentReceipt
  /** Extra rows, for example what was bought. Shown after the payment details. */
  details?: ReceiptDetail[]
  /** Adds a "Done" button that calls this. */
  onDone?: () => void
  country?: CountryConfig
  locale?: Locale
}

/** A confirmation card for a successful payment: amount, method, reference and date. */
export function ReceiptCard({
  receipt,
  details,
  onDone,
  country: countryProp,
  locale: localeProp,
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
        <CircleCheck className="size-6 shrink-0 text-green-600 dark:text-green-500" aria-hidden />
        <h3 id={titleId} className="font-semibold">
          {t("receipt.title")}
        </h3>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
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
        <Button type="button" onClick={onDone}>
          {t("receipt.done")}
        </Button>
      )}
    </section>
  )
}
