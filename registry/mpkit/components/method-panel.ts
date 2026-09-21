import type { ComponentType } from "react"

import type { CountryConfig, CurrencyCode, Locale } from "@/lib/mpkit/countries/types"
import type { PaymentMethod } from "@/lib/mpkit/payment-methods"

/**
 * (Beta: this API may change before 1.0.)
 *
 * What the checkout gives a payment method's panel. A panel is where you host
 * your payment provider's own fields or buttons, for example Stripe's Payment
 * Element or PayPal's buttons.
 *
 * The rule that keeps you safe: **card details never enter MP Kit.** Your
 * provider's fields keep them, and hand back an opaque token (a Stripe
 * confirmation token, a PayPal order id). That token is all the checkout sees,
 * and it reaches your `onPay` as `payload`.
 */
export interface MethodPanelProps {
  method: PaymentMethod
  /** The amount being paid, in CFA francs, as it is when the panel renders. */
  amount: number
  currency: CurrencyCode
  locale: Locale
  country: CountryConfig
  /** True while the checkout is busy, for example collecting the token. Disable your fields. */
  disabled: boolean
  /**
   * Tell the checkout whether the panel is complete enough to pay. Until you
   * call it with true, pressing Pay asks the customer to finish the details.
   */
  setReady: (ready: boolean) => void
  /**
   * Give the checkout the function to run when the customer presses Pay. It
   * returns the payload for `onPay`, for example a Stripe confirmation token.
   * If it throws, nothing is paid; call `setError` first to say why.
   * Pass null to remove it.
   */
  setCollect: (collect: (() => Promise<unknown>) | null) => void
  /**
   * For panels that start the payment themselves, such as PayPal's buttons:
   * pay now, with this payload. Set `submit: "panel"` so the Pay button is hidden.
   */
  submit: (payload?: unknown) => void
  /** Show a message under the panel, for example a card error from your provider. Pass undefined to clear it. */
  setError: (message: string | undefined) => void
}

export interface MethodPanel {
  /**
   * A React component that renders your provider's fields or buttons. It can use
   * hooks, and it can sit inside your provider's own context (Stripe's
   * `<Elements>`, PayPal's script provider).
   */
  component: ComponentType<MethodPanelProps>
  /**
   * "checkout" (default): the checkout's Pay button submits, and calls the
   * function you gave to `setCollect`. "panel": your panel submits by itself
   * with `submit(payload)`, and the Pay button is hidden.
   */
  submit?: "checkout" | "panel"
}
