"use client"

import { useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { MockCardPanel, MockWalletPanel } from "@/components/site/mock-panels"
import { MpKitProvider } from "@/components/mpkit/mpkit-provider"
import { MomoCheckout } from "@/components/mpkit/momo-checkout"
import { cm } from "@/lib/mpkit/countries/cm"
import type { Locale } from "@/lib/mpkit/countries/types"
import { defaultPaymentMethods, type PaymentMethod } from "@/lib/mpkit/payment-methods"
import { createDemoBackend } from "@/lib/demo-backend"
import type { PaymentRequest } from "@/hooks/mpkit/use-momo-checkout"

const methods: PaymentMethod[] = [
  ...defaultPaymentMethods(cm, { cash: false }),
  { id: "wallet", kind: "other", label: "Demo wallet", description: "A simulated wallet" },
]

const panels = {
  card: { component: MockCardPanel },
  wallet: { component: MockWalletPanel, submit: "panel" as const },
}

/** The checkout with a simulated card panel and wallet, and a view of what onPay receives. */
export function PanelsDemo() {
  const [locale, setLocale] = useState<Locale>("en")
  const [backend] = useState(() => createDemoBackend({ scenario: "approve" }))
  const [received, setReceived] = useState<string>()

  async function onPay(request: PaymentRequest) {
    const { signal, ...visible } = request
    void signal
    setReceived(JSON.stringify(visible, null, 2))
    return backend.onPay(request)
  }

  return (
    <MpKitProvider country={cm} locale={locale}>
      <div className="space-y-4">
        <LocaleToggle locale={locale} onChange={setLocale} />
        <div className="grid gap-6 md:grid-cols-2">
          <MomoCheckout
            amount={25000}
            methods={methods}
            panels={panels}
            timeoutMs={30_000}
            pollIntervalMs={1_000}
            onPay={onPay}
            onCheckStatus={backend.onCheckStatus}
            footer="Payments are simulated."
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">What your onPay receives</p>
            <pre
              aria-live="polite"
              className="bg-muted min-h-40 overflow-x-auto rounded-lg border p-3 text-xs"
            >
              {received ?? "Choose a method and pay to see the request."}
            </pre>
            <p className="text-muted-foreground text-xs text-pretty">
              Only the token from the panel reaches your code, never card details.
            </p>
          </div>
        </div>
      </div>
    </MpKitProvider>
  )
}
