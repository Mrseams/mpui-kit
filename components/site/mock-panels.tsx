"use client"

import { Check } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import type { MethodPanelProps } from "@/components/mpkit/method-panel"

/**
 * Stand-ins for a payment provider's hosted fields, for the docs demos only.
 *
 * They collect nothing: there is no card number field, just a button that
 * pretends the customer filled the provider's form. In a real checkout your
 * provider's own secure fields appear in this place.
 */
export function MockCardPanel({ disabled, setReady, setCollect }: MethodPanelProps) {
  const [filled, setFilled] = useState(false)

  useEffect(() => {
    setReady(filled)
  }, [filled, setReady])

  // What the checkout runs when Pay is pressed. A real panel would ask its
  // provider for a token here; this one invents one after a short pause.
  useEffect(() => {
    setCollect(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return { confirmationToken: "ctoken_demo_4242" }
    })
    return () => setCollect(null)
  }, [setCollect])

  return (
    <div className="bg-muted/40 space-y-3 rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">Simulated card fields</p>
      <p className="text-muted-foreground text-xs text-pretty">
        Your provider&apos;s secure fields appear here. This demo has none and collects nothing.
      </p>
      <Button
        type="button"
        variant={filled ? "secondary" : "outline"}
        size="sm"
        disabled={disabled}
        aria-pressed={filled}
        onClick={() => setFilled((value) => !value)}
      >
        {filled && <Check aria-hidden="true" />}
        {filled ? "Test card filled in" : "Fill in a test card"}
      </Button>
    </div>
  )
}

export function MockWalletPanel({ disabled, submit }: MethodPanelProps) {
  return (
    <div className="bg-muted/40 space-y-3 rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">Simulated wallet button</p>
      <p className="text-muted-foreground text-xs text-pretty">
        A provider&apos;s button, such as PayPal&apos;s, starts the payment itself. This one is a
        stand-in.
      </p>
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        onClick={() => submit({ orderId: "ORDER-DEMO-1" })}
      >
        Pay with the demo wallet
      </Button>
    </div>
  )
}
