"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { LocaleToggle } from "@/components/site/locale-toggle"
import { MboaProvider } from "@/components/mboa/mboa-provider"
import { UssdPrompt } from "@/components/mboa/ussd-prompt"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"

const DURATIONS = [15, 45, 120] as const

export function UssdDemo() {
  const [locale, setLocale] = useState<Locale>("fr")
  const [seconds, setSeconds] = useState<(typeof DURATIONS)[number]>(15)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  const start = () => setExpiresAt(Date.now() + seconds * 1000)

  return (
    <MboaProvider country={cm} locale={locale}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label htmlFor="ussd-demo-seconds" className="text-sm font-medium">
              Timeout
            </label>
            <select
              id="ussd-demo-seconds"
              className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
              value={seconds}
              onChange={(event) =>
                setSeconds(Number(event.target.value) as (typeof DURATIONS)[number])
              }
            >
              {DURATIONS.map((value) => (
                <option key={value} value={value}>
                  {value} seconds
                </option>
              ))}
            </select>
          </div>
          <Button type="button" onClick={start}>
            {expiresAt === null ? "Start a request" : "Restart"}
          </Button>
          <LocaleToggle locale={locale} onChange={setLocale} />
        </div>

        {expiresAt !== null && (
          <div className="max-w-md">
            <UssdPrompt code="*123#" phone="+237651234567" expiresAt={expiresAt} onRetry={start} />
          </div>
        )}
        <p className="text-muted-foreground text-sm">
          The code <code>*123#</code> is a made-up example. On a phone, “Dial now” opens the dialer
          with it filled in.
        </p>
      </div>
    </MboaProvider>
  )
}
