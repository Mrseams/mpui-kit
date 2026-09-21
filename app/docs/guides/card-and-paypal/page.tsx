import type { Metadata } from "next"
import Link from "next/link"

import { PanelsDemo } from "@/app/docs/guides/card-and-paypal/panels-demo"
import { CodeBlock } from "@/components/site/code-block"

export const metadata: Metadata = { title: "Card and PayPal" }

const setup = `import { MomoCheckout } from "@/components/mboa/momo-checkout"
import { defaultPaymentMethods } from "@/lib/mboa/payment-methods"

const methods = [
  ...defaultPaymentMethods(cm, { card: false, cash: false }), // MTN, Orange...
  { id: "card", kind: "card" },
  { id: "paypal", kind: "other", label: "PayPal", description: "Pay with your PayPal account" },
]

<MomoCheckout
  amount={25000}
  methods={methods}
  panels={{
    card: { component: StripeCardPanel },
    paypal: { component: PayPalPanel, submit: "panel" },
  }}
  onPay={async ({ methodId, phone, payload }) => {
    // Your server creates the charge. It never trusts an amount sent from the browser.
    const res = await fetch("/api/pay", {
      method: "POST",
      body: JSON.stringify({ methodId, phone, payload }),
    })
    if (!res.ok) return { status: "failed", reason: "gateway_error" }
    const { reference } = await res.json()
    return { status: "success", reference } // or "pending", then onCheckStatus
  }}
/>`

const contract = `interface MethodPanelProps {
  method: PaymentMethod
  amount: number
  currency: "XAF" | "XOF"
  disabled: boolean                    // true while the token is being made
  setReady(ready: boolean): void       // "the fields are complete enough to pay"
  setCollect(fn: (() => Promise<unknown>) | null): void // runs when Pay is pressed, returns the token
  submit(payload?: unknown): void      // for a panel that pays by itself (submit: "panel")
  setError(message: string | undefined): void           // shown under the panel
}

interface MethodPanel {
  component: ComponentType<MethodPanelProps>
  submit?: "checkout" | "panel"        // "checkout" (default) uses the Pay button
}`

const stripe = `// SKETCH: not run in this repository. Check it against Stripe's current docs.
"use client"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useEffect } from "react"
import type { MethodPanelProps } from "@/components/mboa/method-panel"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function Fields({ disabled, setReady, setCollect, setError }: MethodPanelProps) {
  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    if (!stripe || !elements) return
    setCollect(async () => {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message)
        throw submitError
      }
      const { error, confirmationToken } = await stripe.createConfirmationToken({ elements })
      if (error) {
        setError(error.message)
        throw error
      }
      // Only this id leaves the panel. Your server confirms the payment with it.
      return { confirmationTokenId: confirmationToken.id }
    })
    return () => setCollect(null)
  }, [stripe, elements, setCollect, setError])

  return (
    <PaymentElement
      onChange={(event) => setReady(event.complete)}
      options={{ readOnly: disabled }}
    />
  )
}

export function StripeCardPanel(props: MethodPanelProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{ mode: "payment", amount: props.amount, currency: "eur" }}
    >
      <Fields {...props} />
    </Elements>
  )
}`

const paypal = `// SKETCH: not run in this repository. Check it against PayPal's current docs.
"use client"
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import type { MethodPanelProps } from "@/components/mboa/method-panel"

export function PayPalPanel({ disabled, submit, setError }: MethodPanelProps) {
  return (
    <PayPalScriptProvider
      options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!, currency: "EUR" }}
    >
      <PayPalButtons
        disabled={disabled}
        createOrder={async () => {
          // Your server creates the order from ITS record of the price.
          const res = await fetch("/api/paypal/orders", { method: "POST" })
          return (await res.json()).id
        }}
        onApprove={async (data) => submit({ orderId: data.orderID })}
        onError={() => setError("PayPal could not start. Please try again.")}
      />
    </PayPalScriptProvider>
  )
}
// Register it with { submit: "panel" }: PayPal's buttons are the Pay button.
// Your onPay then receives { payload: { orderId } }, and your server captures the order.`

const serverNotes = `// On your server, for the card flow (sketch)
// 1. Read the price from YOUR data. Ignore any amount sent by the browser.
// 2. Create the payment with the token from payload, and confirm it.
// 3. Answer { status: "success", reference } or { status: "failed", reason }.
// 4. Also handle the provider's webhook: that is the source of truth.`

export default function CardAndPayPalPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Card and PayPal</h1>
        <p className="text-muted-foreground max-w-prose">
          Add a card form, PayPal or any other method to the checkout by giving it a <em>panel</em>:
          a place where your payment provider&apos;s own fields or buttons live.
        </p>
      </header>

      <section aria-labelledby="rule" className="space-y-3">
        <h2 id="rule" className="text-xl font-semibold">
          The rule: card details never enter mboa-ui
        </h2>
        <p className="text-muted-foreground max-w-prose">
          mboa-ui does not build card fields. Your provider&apos;s hosted fields (Stripe&apos;s
          Payment Element, PayPal&apos;s buttons) keep the card details in their own iframe. When
          the customer presses Pay, the panel asks the provider for an opaque token and the checkout
          hands that token to your <code>onPay</code> as <code>payload</code>. It is never shown on
          the receipt.
        </p>
        <p className="text-muted-foreground max-w-prose">
          This keeps your site out of the heaviest part of card-industry (PCI DSS) compliance. Your
          provider can tell you which self-assessment applies to you.
        </p>
      </section>

      <section aria-labelledby="demo" className="space-y-3">
        <h2 id="demo" className="text-xl font-semibold">
          Try it
        </h2>
        <p className="text-muted-foreground max-w-prose">
          These panels are <strong>simulated</strong>. They collect nothing and contact no provider.
          Watch the right side: only a made-up token arrives.
        </p>
        <div className="rounded-lg border p-4 sm:p-6">
          <PanelsDemo />
        </div>
      </section>

      <section aria-labelledby="setup" className="space-y-3">
        <h2 id="setup" className="text-xl font-semibold">
          Set it up
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Add the method, then map its id to a panel. A method of kind{" "}
          <code>&quot;other&quot;</code> takes any label and description, and{" "}
          <code>methodIcons</code> takes your own logo.
        </p>
        <CodeBlock label="Checkout with card and PayPal" code={setup} />
      </section>

      <section aria-labelledby="contract" className="space-y-3">
        <h2 id="contract" className="text-xl font-semibold">
          The panel contract
        </h2>
        <p className="text-muted-foreground max-w-prose">
          A panel is a React component. It tells the checkout when it is complete with{" "}
          <code>setReady</code>, and gives it the function that produces the token with{" "}
          <code>setCollect</code>. Until the panel is ready, pressing Pay asks the customer to
          finish the details and pays nothing. If collecting fails, nothing is paid and the
          panel&apos;s own message (or a generic one) is shown.
        </p>
        <CodeBlock label="MethodPanel types" code={contract} />
      </section>

      <section aria-labelledby="stripe" className="space-y-3">
        <h2 id="stripe" className="text-xl font-semibold">
          Example: Stripe Elements
        </h2>
        <p className="text-muted-foreground max-w-prose">
          A sketch of a card panel with Stripe&apos;s Payment Element.{" "}
          <strong>It has not been run in this repository</strong>, so check it against Stripe&apos;s
          current documentation before you use it.
        </p>
        <CodeBlock label="StripeCardPanel sketch" code={stripe} />
        <CodeBlock label="Server side notes" code={serverNotes} />
      </section>

      <section aria-labelledby="paypal" className="space-y-3">
        <h2 id="paypal" className="text-xl font-semibold">
          Example: PayPal buttons
        </h2>
        <p className="text-muted-foreground max-w-prose">
          PayPal&apos;s buttons start the payment themselves, so this panel is registered with{" "}
          <code>submit: &quot;panel&quot;</code> to hide the Pay button. Also{" "}
          <strong>not run here</strong>: check it against PayPal&apos;s current documentation.
        </p>
        <CodeBlock label="PayPalPanel sketch" code={paypal} />
      </section>

      <section aria-labelledby="notes" className="space-y-3">
        <h2 id="notes" className="text-xl font-semibold">
          Before you go live
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            <strong>Currency.</strong> Providers support different currencies, and not every one can
            charge in CFA francs (XAF or XOF). Check what yours accepts. You may need to charge in
            another currency, such as euros, and show that amount to the customer.
          </li>
          <li>
            <strong>Confirm on your server.</strong> The token proves nothing about payment. Your
            server creates and confirms the charge, and your provider&apos;s webhook is the source
            of truth.
          </li>
          <li>
            <strong>Never trust the amount from the browser.</strong> Read the price from your own
            data when you create the charge or the PayPal order.
          </li>
          <li>
            <strong>Logos.</strong> mboa-ui ships no brand logos. If you show PayPal&apos;s or a
            card network&apos;s, follow their brand guidelines and pass them with{" "}
            <code>methodIcons</code>.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          See also the{" "}
          <Link
            href="/docs/components/momo-checkout"
            className="text-foreground underline underline-offset-4"
          >
            checkout reference
          </Link>
          .
        </p>
      </section>
    </article>
  )
}
