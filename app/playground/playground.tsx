"use client"

import { useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { Currency } from "@/components/mboa/currency"
import { MboaProvider, useCountry, useLocale, useT } from "@/components/mboa/mboa-provider"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"
import { formatFcfa, type CurrencyDisplay } from "@/lib/mboa/format-fcfa"
import { formatInternational, validatePhone } from "@/lib/mboa/phone"

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
  const country = useCountry()
  const locale = useLocale()
  const t = useT()
  const [raw, setRaw] = useState("")

  const result = validatePhone(raw, country)
  const operator = result.operator

  return (
    <Section title="Phone parsing">
      <div className="space-y-1">
        <label htmlFor="pg-phone" className="text-sm font-medium">
          {t("phone.label")} ({country.name[locale]})
        </label>
        <input
          id="pg-phone"
          className={inputClass}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="6 51 23 45 67"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          {t("phone.hint", { length: country.nationalNumberLength })}
        </p>
      </div>

      <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm" aria-live="polite">
        <dt className="text-muted-foreground">Operator</dt>
        <dd className="flex items-center gap-2">
          {operator ? (
            <>
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ backgroundColor: operator.color }}
              />
              {operator.name}
            </>
          ) : (
            <span className="text-muted-foreground">{t("phone.operatorUnknown")}</span>
          )}
        </dd>
        <dt className="text-muted-foreground">National</dt>
        <dd>{result.national ? formatInternational(result.national, country) : "—"}</dd>
        <dt className="text-muted-foreground">E.164</dt>
        <dd>{result.e164 ?? "—"}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{result.valid ? "valid" : (result.issue ?? "—")}</dd>
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
