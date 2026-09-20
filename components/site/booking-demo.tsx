"use client"

import { useId, useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { Button } from "@/components/ui/button"
import { Currency } from "@/components/mboa/currency"
import { MboaProvider } from "@/components/mboa/mboa-provider"
import { MomoCheckout } from "@/components/mboa/momo-checkout"
import { bookingCopy, bookingTotal, clampNights, listing } from "@/lib/booking"
import { createDemoBackend, type DemoScenario } from "@/lib/demo-backend"
import type { CheckoutStatus } from "@/lib/mboa/checkout-machine"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"

const SCENARIOS: DemoScenario[] = ["approve", "decline", "timeout", "error"]

/**
 * The landing page demo: a fake apartment booking priced per night in FCFA,
 * paid through the real MomoCheckout. The backend is fake: it waits a few
 * seconds, like a customer approving on their phone, and no data leaves the
 * browser.
 */
export function BookingDemo() {
  const [locale, setLocale] = useState<Locale>("fr")
  const [nights, setNights] = useState(2)
  const [status, setStatus] = useState<CheckoutStatus>("idle")
  const [scenario, setScenario] = useState<DemoScenario>("approve")
  const [backend] = useState(() =>
    createDemoBackend({ scenario: "approve", approveAfterMs: 4_000 })
  )

  const listingId = useId()
  const nightsId = useId()
  const scenarioId = useId()

  const copy = bookingCopy[locale]
  // The order cannot change while a payment is in progress or showing its result.
  const locked = status !== "idle"
  const total = bookingTotal(nights)

  return (
    <MboaProvider country={cm} locale={locale}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{copy.fakeNote}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm">{copy.language}</span>
            <LocaleToggle locale={locale} onChange={setLocale} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <section
            aria-labelledby={listingId}
            className="bg-card overflow-hidden rounded-xl border"
          >
            {/* No photo on purpose: nothing to download on a slow connection. */}
            <div aria-hidden="true" className="from-primary/20 to-primary/5 h-24 bg-linear-to-br" />
            <div className="space-y-4 p-4 sm:p-6">
              <div className="space-y-1">
                <h3 id={listingId} className="font-semibold">
                  {listing.name[locale]}
                </h3>
                <p className="text-muted-foreground text-sm">{listing.area}</p>
              </div>

              <p className="flex items-baseline gap-2">
                <Currency amount={listing.pricePerNight} className="text-lg font-semibold" />
                <span className="text-muted-foreground text-sm">{copy.perNight}</span>
              </p>

              <div role="group" aria-labelledby={nightsId} className="flex items-center gap-3">
                <span id={nightsId} className="text-sm font-medium">
                  {copy.nights}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={copy.fewer}
                  disabled={locked || nights <= listing.minNights}
                  onClick={() => setNights((current) => clampNights(current - 1))}
                >
                  −
                </Button>
                <output aria-live="polite" className="w-6 text-center font-medium tabular-nums">
                  {nights}
                </output>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={copy.more}
                  disabled={locked || nights >= listing.maxNights}
                  onClick={() => setNights((current) => clampNights(current + 1))}
                >
                  +
                </Button>
              </div>

              <p className="text-muted-foreground flex flex-wrap items-baseline gap-x-1 text-sm">
                {copy.nightsCount(nights)} × <Currency amount={listing.pricePerNight} />
              </p>

              {locked && (
                <p role="status" className="text-muted-foreground text-xs">
                  {copy.locked}
                </p>
              )}
            </div>
          </section>

          <MomoCheckout
            amount={total}
            title={copy.title}
            summary={`${copy.nightsCount(nights)} · ${listing.name[locale]}`}
            receiptDetails={[
              { label: copy.apartment, value: listing.name[locale] },
              { label: copy.stay, value: copy.nightsCount(nights) },
            ]}
            failureMessages={{ declined_by_user: copy.declined }}
            timeoutMs={30_000}
            pollIntervalMs={1_000}
            onPay={backend.onPay}
            onCheckStatus={backend.onCheckStatus}
            onStatusChange={setStatus}
          />
        </div>

        <details className="text-sm">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
            {copy.failureCases}
          </summary>
          <div className="mt-3 space-y-1">
            <label htmlFor={scenarioId} className="text-sm font-medium">
              {copy.scenarioLabel}
            </label>
            <select
              id={scenarioId}
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 block h-9 w-full max-w-sm rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
              value={scenario}
              onChange={(event) => {
                const next = event.target.value as DemoScenario
                setScenario(next)
                backend.setScenario(next)
              }}
            >
              {SCENARIOS.map((value) => (
                <option key={value} value={value}>
                  {copy.scenarios[value]}
                </option>
              ))}
            </select>
          </div>
        </details>
      </div>
    </MboaProvider>
  )
}
