"use client"

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"

import type { MethodPanelProps } from "@/components/mpui-kit/method-panel"

/**
 * PayPal's own documented placeholder client id for sandbox testing without a
 * developer account (see https://developer.paypal.com/sdk/js/). Set
 * NEXT_PUBLIC_PAYPAL_CLIENT_ID to use your own sandbox or live client id
 * instead.
 */
const PAYPAL_SANDBOX_CLIENT_ID = "sb"

/**
 * A placeholder order, in a currency PayPal actually supports (US dollars).
 * PayPal does not currently settle in CFA francs, so this is unrelated to the
 * FCFA price shown elsewhere on the page.
 */
const DEMO_CURRENCY = "USD"
const DEMO_AMOUNT = "10.00"

/**
 * PayPal's real Buttons widget, in sandbox mode. Approving the order needs a
 * PayPal (sandbox) account, which this demo does not create for you.
 *
 * **Demo-only shortcut:** the order below is created in the browser, from a
 * fixed amount. In your app, create the order on your server instead, from
 * your own record of the price — otherwise nothing stops it being changed
 * before it reaches PayPal. This panel is registered with `submit: "panel"`,
 * so PayPal's button is the Pay button: `onApprove` calls `submit` with the
 * order id, which reaches your `onPay` as `payload`.
 */
export function PayPalPanel({ disabled, submit, setError }: MethodPanelProps) {
  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? PAYPAL_SANDBOX_CLIENT_ID,
        currency: DEMO_CURRENCY,
        intent: "capture",
        components: "buttons",
      }}
    >
      <PayPalButtons
        disabled={disabled}
        style={{ layout: "horizontal" }}
        createOrder={(_data, actions) =>
          actions.order.create({
            intent: "CAPTURE",
            purchase_units: [{ amount: { currency_code: DEMO_CURRENCY, value: DEMO_AMOUNT } }],
          })
        }
        onApprove={async (data) => submit({ orderId: data.orderID })}
        onError={() => setError("PayPal could not start. Please try again.")}
      />
    </PayPalScriptProvider>
  )
}
