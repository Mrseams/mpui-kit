"use client"

import { useId, useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { Button } from "@/components/ui/button"
import { Currency } from "@/components/mpkit/currency"
import { MpKitProvider } from "@/components/mpkit/mpkit-provider"
import { MomoCheckout } from "@/components/mpkit/momo-checkout"
import { bookingCopy, bookingTotal, clampNights, listing } from "@/lib/booking"
import { createDemoBackend, type DemoScenario } from "@/lib/demo-backend"
import type { CheckoutStatus } from "@/lib/mpkit/checkout-machine"
import { cm } from "@/lib/mpkit/countries/cm"
import type { Locale } from "@/lib/mpkit/countries/types"

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
    <MpKitProvider country={cm} locale={locale}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{copy.fakeNote}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm">{copy.language}</span>
            <LocaleToggle locale={locale} onChange={setLocale} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
          <section
            aria-labelledby={listingId}
            className="bg-card flex flex-col overflow-hidden rounded-xl border"
          >
            {/* An illustration instead of a photo: nothing to download on a slow connection. */}
            <ListingArt />
            <div className="flex flex-1 flex-col justify-between gap-6 p-4 sm:p-6">
              <div className="space-y-3">
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
              </div>

              <div
                role="group"
                aria-labelledby={nightsId}
                className="flex items-center justify-between gap-3 rounded-lg border p-2 pl-4"
              >
                <span id={nightsId} className="text-sm font-medium">
                  {copy.nights}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 text-lg"
                    aria-label={copy.fewer}
                    disabled={locked || nights <= listing.minNights}
                    onClick={() => setNights((current) => clampNights(current - 1))}
                  >
                    −
                  </Button>
                  <output
                    aria-live="polite"
                    className="w-10 text-center text-lg font-semibold tabular-nums"
                  >
                    {nights}
                  </output>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 text-lg"
                    aria-label={copy.more}
                    disabled={locked || nights >= listing.maxNights}
                    onClick={() => setNights((current) => clampNights(current + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-4 border-t pt-4 text-sm">
                  <span className="text-muted-foreground">
                    {copy.nightsCount(nights)} × <Currency amount={listing.pricePerNight} />
                  </span>
                  <Currency amount={bookingTotal(nights)} className="font-semibold" />
                </div>

                {locked && (
                  <p role="status" className="text-muted-foreground text-xs">
                    {copy.locked}
                  </p>
                )}
              </div>
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
    </MpKitProvider>
  )
}

/**
 * A small skyline drawn with SVG shapes: about a kilobyte, no download, and it
 * follows the theme because every fill is a token.
 */
function ListingArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 96"
      preserveAspectRatio="xMidYMid slice"
      className="fill-primary h-24 w-full"
    >
      <rect width="320" height="96" className="fill-primary/10" />
      <circle cx="262" cy="26" r="13" className="fill-primary/20" />
      <g className="fill-primary/20">
        <rect x="18" y="52" width="34" height="44" rx="3" />
        <rect x="58" y="36" width="40" height="60" rx="3" />
        <rect x="222" y="48" width="36" height="48" rx="3" />
        <rect x="264" y="58" width="38" height="38" rx="3" />
      </g>
      <g className="fill-primary/35">
        <rect x="104" y="20" width="58" height="76" rx="4" />
        <rect x="168" y="42" width="48" height="54" rx="4" />
      </g>
      <g className="fill-background/80">
        <rect x="114" y="32" width="10" height="10" rx="1.5" />
        <rect x="132" y="32" width="10" height="10" rx="1.5" />
        <rect x="114" y="50" width="10" height="10" rx="1.5" />
        <rect x="132" y="50" width="10" height="10" rx="1.5" />
        <rect x="178" y="54" width="10" height="10" rx="1.5" />
        <rect x="194" y="54" width="10" height="10" rx="1.5" />
      </g>
      <rect y="90" width="320" height="6" className="fill-primary/25" />
    </svg>
  )
}
