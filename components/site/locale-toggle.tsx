"use client"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/mpkit/countries/types"

/** FR/EN switch for docs demos. It only reports the choice; the demo owns the state. */
export function LocaleToggle({
  locale,
  onChange,
}: {
  locale: Locale
  onChange: (next: Locale) => void
}) {
  return (
    <div role="group" aria-label="Language" className="flex items-center gap-2">
      {(["fr", "en"] as const).map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={locale === option ? "default" : "outline"}
          aria-pressed={locale === option}
          onClick={() => onChange(option)}
        >
          {option.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
