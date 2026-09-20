"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { LocaleToggle } from "@/components/site/locale-toggle"
import { PhoneInput } from "@/components/mboa/phone-input"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"
import { createPhoneSchema } from "@/lib/mboa/phone-schema"

export function PhoneFormDemo() {
  const [locale, setLocale] = useState<Locale>("en")

  return (
    <div className="space-y-4">
      <LocaleToggle locale={locale} onChange={setLocale} />
      {/* Remount when the language changes so the schema's messages match. */}
      <PhoneForm key={locale} locale={locale} />
    </div>
  )
}

function PhoneForm({ locale }: { locale: Locale }) {
  const schema = useMemo(() => z.object({ phone: createPhoneSchema(cm, { locale }) }), [locale])
  const [submitted, setSubmitted] = useState<string | null>(null)

  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  })

  return (
    <form
      noValidate
      className="max-w-sm space-y-3"
      onSubmit={form.handleSubmit((data) => setSubmitted(data.phone))}
    >
      <Controller
        control={form.control}
        name="phone"
        render={({ field, fieldState }) => (
          <PhoneInput
            country={cm}
            locale={locale}
            ref={field.ref}
            name={field.name}
            value={field.value}
            onChange={(value) => field.onChange(value)}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Button type="submit">{locale === "fr" ? "Envoyer" : "Submit"}</Button>
      <p className="text-sm" aria-live="polite">
        {submitted ? (
          <>
            Parsed value: <code>{submitted}</code>
          </>
        ) : null}
      </p>
    </form>
  )
}
