"use client"

import { useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { MboaProvider } from "@/components/mboa/mboa-provider"
import { PhoneInput } from "@/components/mboa/phone-input"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"
import type { PhoneValidation } from "@/lib/mboa/phone"

const selectClass =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"

export function PhoneInputDemo() {
  const [locale, setLocale] = useState<Locale>("fr")
  const [operator, setOperator] = useState("")
  const [value, setValue] = useState("")
  const [details, setDetails] = useState<PhoneValidation | null>(null)

  return (
    <MboaProvider country={cm} locale={locale}>
      <div className="space-y-6">
        <div className="max-w-sm">
          <PhoneInput
            value={value}
            onChange={(next, result) => {
              setValue(next)
              setDetails(result)
            }}
            operator={operator || undefined}
          />
        </div>

        <dl
          className="grid max-w-sm grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-sm"
          aria-live="polite"
        >
          <dt className="text-muted-foreground">value</dt>
          <dd className="font-mono">{JSON.stringify(value)}</dd>
          <dt className="text-muted-foreground">e164</dt>
          <dd className="font-mono">{JSON.stringify(details?.e164 ?? null)}</dd>
          <dt className="text-muted-foreground">valid</dt>
          <dd className="font-mono">{String(details?.valid ?? false)}</dd>
          <dt className="text-muted-foreground">issue</dt>
          <dd className="font-mono">{details?.issue ?? "—"}</dd>
        </dl>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="phone-demo-operator" className="text-sm font-medium">
              operator
            </label>
            <select
              id="phone-demo-operator"
              className={selectClass}
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
            >
              <option value="">any</option>
              {cm.operators.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">locale</span>
            <LocaleToggle locale={locale} onChange={setLocale} />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          Try <code>6 51 23 45 67</code>, paste <code>+237 655 12 34 56</code>, or use the operator
          option to require a specific operator.
        </p>
      </div>
    </MboaProvider>
  )
}
