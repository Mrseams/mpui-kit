"use client"

import { useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { MboaProvider } from "@/components/mboa/mboa-provider"
import { MomoCheckout } from "@/components/mboa/momo-checkout"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"
import { createDemoBackend, type DemoScenario } from "@/lib/demo-backend"

const SCENARIOS: { value: DemoScenario; label: string }[] = [
  { value: "approve", label: "Approve after 5 seconds" },
  { value: "decline", label: "Decline after 5 seconds" },
  { value: "timeout", label: "Never answer (times out)" },
  { value: "error", label: "Backend error" },
]

const FAILURE_MESSAGES: Record<Locale, Record<string, string>> = {
  en: { declined_by_user: "You declined the request on your phone." },
  fr: { declined_by_user: "Vous avez refusé la demande sur votre téléphone." },
}

/** The checkout wired to a fake backend, with a control to pick what the fake user does. */
export function CheckoutDemo({ showControls = true }: { showControls?: boolean }) {
  const [locale, setLocale] = useState<Locale>("fr")
  const [scenario, setScenario] = useState<DemoScenario>("approve")

  // The backend keeps its own scenario, so changing it mid-payment takes effect.
  const [backend] = useState(() => createDemoBackend({ scenario: "approve" }))

  return (
    <MboaProvider country={cm} locale={locale}>
      <div className="space-y-6">
        {showControls && (
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label htmlFor="checkout-demo-scenario" className="text-sm font-medium">
                What the fake user does on their phone
              </label>
              <select
                id="checkout-demo-scenario"
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
                value={scenario}
                onChange={(event) => {
                  const next = event.target.value as DemoScenario
                  setScenario(next)
                  backend.setScenario(next)
                }}
              >
                {SCENARIOS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <LocaleToggle locale={locale} onChange={setLocale} />
          </div>
        )}

        <div className="max-w-lg">
          <MboaCheckout locale={locale} backend={backend} />
        </div>
      </div>
    </MboaProvider>
  )
}

function MboaCheckout({
  locale,
  backend,
}: {
  locale: Locale
  backend: ReturnType<typeof createDemoBackend>
}) {
  return (
    <MomoCheckout
      amount={25000}
      timeoutMs={30_000}
      pollIntervalMs={1_000}
      onPay={backend.onPay}
      onCheckStatus={backend.onCheckStatus}
      failureMessages={FAILURE_MESSAGES[locale]}
    />
  )
}
