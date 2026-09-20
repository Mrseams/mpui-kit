"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { LocaleToggle } from "@/components/site/locale-toggle"
import { MboaProvider } from "@/components/mboa/mboa-provider"
import { PaymentMethodPicker } from "@/components/mboa/payment-method-picker"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"
import {
  emptySelection,
  type PaymentSelection,
  type ResolvedPayment,
} from "@/lib/mboa/payment-methods"

export function PickerDemo() {
  const [locale, setLocale] = useState<Locale>("fr")
  const [selection, setSelection] = useState<PaymentSelection>(emptySelection)
  const [resolved, setResolved] = useState<ResolvedPayment | null>(null)

  return (
    <MboaProvider country={cm} locale={locale}>
      <div className="space-y-6">
        <div className="max-w-xl">
          <PaymentMethodPicker
            value={selection}
            onChange={(next, result) => {
              setSelection(next)
              setResolved(result)
            }}
          />
        </div>

        <dl
          className="grid max-w-xl grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm"
          aria-live="polite"
        >
          <dt className="text-muted-foreground">methodId</dt>
          <dd className="font-mono">{JSON.stringify(selection.methodId)}</dd>
          <dt className="text-muted-foreground">e164</dt>
          <dd className="font-mono">{JSON.stringify(resolved?.e164 ?? null)}</dd>
          <dt className="text-muted-foreground">ready</dt>
          <dd className="font-mono">{String(resolved?.ready ?? false)}</dd>
        </dl>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" disabled={!resolved?.ready}>
            {locale === "fr" ? "Payer" : "Pay"}
          </Button>
          <LocaleToggle locale={locale} onChange={setLocale} />
        </div>
      </div>
    </MboaProvider>
  )
}
