"use client"

import { useState } from "react"

import { LocaleToggle } from "@/components/site/locale-toggle"
import { PayPalPanel } from "@/components/site/paypal-panel"
import { StripeCardPanel } from "@/components/site/stripe-card-panel"
import { MpuiKitProvider } from "@/components/mpui-kit/mpui-kit-provider"
import { MomoCheckout } from "@/components/mpui-kit/momo-checkout"
import { cm } from "@/lib/mpui-kit/countries/cm"
import type { Locale } from "@/lib/mpui-kit/countries/types"
import { defaultPaymentMethods, type PaymentMethod } from "@/lib/mpui-kit/payment-methods"
import { createDemoBackend } from "@/lib/demo-backend"
import type { PaymentRequest } from "@/hooks/mpui-kit/use-momo-checkout"

const methods: PaymentMethod[] = [
  ...defaultPaymentMethods(cm, { cash: false }),
  { id: "paypal", kind: "other", label: "PayPal", description: "Pay with your PayPal account" },
]

const panels = {
  card: { component: StripeCardPanel },
  paypal: { component: PayPalPanel, submit: "panel" as const },
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
    <MpuiKitProvider country={cm} locale={locale}>
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
            footer="Card and PayPal are real, in test mode. Nothing is ever charged."
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
              Only the token or order id from the panel reaches your code, never card details.
            </p>
          </div>
        </div>
      </div>
    </MpuiKitProvider>
  )
}
