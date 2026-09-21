"use client"

import { useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { Currency } from "@/components/mpkit/currency"
import { MpKitProvider } from "@/components/mpkit/mpkit-provider"
import { cm } from "@/lib/mpkit/countries/cm"
import type { Locale } from "@/lib/mpkit/countries/types"
import type { CurrencyDisplay } from "@/lib/mpkit/format-fcfa"

const inputClass =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"

export function CurrencyDemo() {
  const [locale, setLocale] = useState<Locale>("fr")
  const [amount, setAmount] = useState("25000")
  const [display, setDisplay] = useState<CurrencyDisplay>("symbol")

  const value = amount.trim() === "" ? Number.NaN : Number(amount)

  return (
    <MpKitProvider country={cm} locale={locale}>
      <div className="space-y-4">
        <p className="text-3xl font-semibold" aria-live="polite">
          <Currency amount={value} display={display} />
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="currency-amount" className="text-sm font-medium">
              Amount
            </label>
            <input
              id="currency-amount"
              className={inputClass}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="currency-display" className="text-sm font-medium">
              display
            </label>
            <select
              id="currency-display"
              className={inputClass}
              value={display}
              onChange={(event) => setDisplay(event.target.value as CurrencyDisplay)}
            >
              <option value="symbol">symbol (FCFA)</option>
              <option value="code">code (XAF)</option>
              <option value="none">none</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">locale</span>
            <LocaleToggle locale={locale} onChange={setLocale} />
          </div>
        </div>
      </div>
    </MpKitProvider>
  )
}
