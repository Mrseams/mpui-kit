"use client"

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { useEffect } from "react"

import type { MethodPanelProps } from "@/components/mpui-kit/method-panel"

/**
 * Stripe's own public test-mode key. It is not a secret: Stripe publishes it
 * in their docs and starter apps for exactly this purpose, so this demo works
 * without a Stripe account. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to use
 * your own test key instead.
 */
const STRIPE_TEST_PUBLISHABLE_KEY = "pk_test_TYooMQauvdEDq54NiTphI7jx"

/**
 * A placeholder amount for the Payment Element, in the smallest unit of a
 * currency Stripe actually supports (cents of a US dollar). Stripe does not
 * currently process CFA francs, so this is unrelated to the FCFA price shown
 * elsewhere on the page; it only tells Stripe roughly how much is being paid,
 * which payment methods it should offer.
 */
const DEMO_AMOUNT_CENTS = 1000
const DEMO_CURRENCY = "usd"

let stripePromise: Promise<Stripe | null> | undefined
function getStripe() {
  stripePromise ??= loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? STRIPE_TEST_PUBLISHABLE_KEY
  )
  return stripePromise
}

function StripeFields({ disabled, setReady, setCollect, setError }: MethodPanelProps) {
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

/**
 * Stripe's real Payment Element, mounted in Stripe's own iframe, in test
 * mode. Card numbers never reach this page: use Stripe's test card
 * 4242 4242 4242 4242, any future expiry, any CVC and postal code.
 *
 * Pressing Pay calls Stripe's `createConfirmationToken`, a real (test-mode)
 * network request to Stripe, and returns its id as the payload. Nothing is
 * ever charged: creating a confirmation token alone moves no money, and
 * completing a charge from it needs a server with your secret key, which
 * this demo intentionally does not have.
 */
export function StripeCardPanel(props: MethodPanelProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={{ mode: "payment", amount: DEMO_AMOUNT_CENTS, currency: DEMO_CURRENCY }}
    >
      <StripeFields {...props} />
    </Elements>
  )
}
