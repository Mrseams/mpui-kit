"use client"

import { useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { Currency } from "@/components/mboa/currency"
import { MboaProvider, useLocale, useT } from "@/components/mboa/mboa-provider"
import { PhoneInput } from "@/components/mboa/phone-input"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"
import { formatFcfa, type CurrencyDisplay } from "@/lib/mboa/format-fcfa"
import type { PhoneValidation } from "@/lib/mboa/phone"

const inputClass =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"

export function Playground() {
  const [locale, setLocale] = useState<Locale>("fr")

  return (
    <MboaProvider country={cm} locale={locale}>
      <div className="mt-6 space-y-8">
        <LocaleToggle locale={locale} onChange={setLocale} />
        <FcfaSection />
        <PhoneSection />
        <StringsSection />
      </div>
    </MboaProvider>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function FcfaSection() {
  const [amount, setAmount] = useState("25000")
  const [display, setDisplay] = useState<CurrencyDisplay>("symbol")

  const value = amount.trim() === "" ? Number.NaN : Number(amount)

  return (
    <Section title="Currency">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="pg-amount" className="text-sm font-medium">
            Amount
          </label>
          <input
            id="pg-amount"
            className={inputClass}
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="pg-display" className="text-sm font-medium">
            Currency display
          </label>
          <select
            id="pg-display"
            className={inputClass}
            value={display}
            onChange={(event) => setDisplay(event.target.value as CurrencyDisplay)}
          >
            <option value="symbol">FCFA</option>
            <option value="code">ISO code</option>
            <option value="none">Number only</option>
          </select>
        </div>
      </div>
      <p className="text-2xl font-semibold" aria-live="polite">
        <Currency amount={value} display={display} />
      </p>
    </Section>
  )
}

function PhoneSection() {
  const [value, setValue] = useState("")
  const [details, setDetails] = useState<PhoneValidation | null>(null)

  return (
    <Section title="PhoneInput">
      <div className="max-w-sm">
        <PhoneInput
          value={value}
          onChange={(next, result) => {
            setValue(next)
            setDetails(result)
          }}
        />
      </div>
      <dl className="grid max-w-sm grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-sm" aria-live="polite">
        <dt className="text-muted-foreground">e164</dt>
        <dd className="font-mono">{details?.e164 ?? "—"}</dd>
        <dt className="text-muted-foreground">valid</dt>
        <dd className="font-mono">{String(details?.valid ?? false)}</dd>
        <dt className="text-muted-foreground">issue</dt>
        <dd className="font-mono">{details?.issue ?? "—"}</dd>
      </dl>
    </Section>
  )
}

function StringsSection() {
  const t = useT()
  const locale = useLocale()

  return (
    <Section title="Dictionary">
      <p className="text-muted-foreground text-sm">
        Every user-facing string goes through the FR/EN dictionary. Current language:{" "}
        <strong>{locale.toUpperCase()}</strong>.
      </p>
      <ul className="space-y-1 text-sm">
        <li>{t("checkout.pay", { amount: formatFcfa(50000, { locale }) })}</li>
        <li>{t("ussd.title")}</li>
        <li>{t("ussd.expiresIn", { time: "1:30" })}</li>
        <li>{t("status.success")}</li>
      </ul>
    </Section>
  )
}
