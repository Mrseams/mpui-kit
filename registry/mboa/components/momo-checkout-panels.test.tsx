// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect, useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MethodPanel, MethodPanelProps } from "@/components/mboa/method-panel"
import { MboaProvider } from "@/components/mboa/mboa-provider"
import { MomoCheckout, type MomoCheckoutProps } from "@/components/mboa/momo-checkout"
import { cm } from "@/lib/mboa/countries/cm"
import type { PaymentMethod } from "@/lib/mboa/payment-methods"

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-01-01T12:00:00Z").getTime())
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

type OnPay = NonNullable<MomoCheckoutProps["onPay"]>

/**
 * A stand-in for a provider's hosted card fields, like Stripe's Payment
 * Element. It holds a fake "card" in its own state, exactly as the provider's
 * iframe would, and hands back only an opaque token.
 */
function MockCardFields({ disabled, setReady, setCollect, setError }: MethodPanelProps) {
  const [complete, setComplete] = useState(false)
  useEffect(() => {
    setReady(complete)
  }, [complete, setReady])
  useEffect(() => {
    setCollect(async () => {
      if (mockCardShouldFail) {
        if (mockCardShouldFail === "with-message") setError("Your card was declined.")
        throw new Error("declined")
      }
      return { token: "tok_test_123" }
    })
    return () => setCollect(null)
  }, [setCollect, setError])
  return (
    <label>
      Card (mock)
      <input
        disabled={disabled}
        aria-label="Mock card"
        onChange={(event) => setComplete(event.target.value.length >= 4)}
      />
    </label>
  )
}
let mockCardShouldFail: false | "with-message" | "silent" = false

/** A stand-in for PayPal's buttons: it starts the payment itself. */
function MockWalletButton({ submit }: MethodPanelProps) {
  return (
    <button type="button" onClick={() => submit({ orderId: "ORDER-9" })}>
      Wallet approve (mock)
    </button>
  )
}

const cardPanel: MethodPanel = { component: MockCardFields }
const walletPanel: MethodPanel = { component: MockWalletButton, submit: "panel" }

const methods: PaymentMethod[] = [
  { id: "mtn", kind: "mobile_money", operatorId: "mtn" },
  { id: "card", kind: "card" },
  { id: "wallet", kind: "other", label: "Digital wallet", description: "Pay with your wallet" },
]

function setup(props: Partial<MomoCheckoutProps> = {}) {
  const onPay = vi.fn<OnPay>().mockResolvedValue({ status: "success", reference: "PAY-1" })
  const user = userEvent.setup({ delay: null })
  render(
    <MboaProvider country={cm} locale="en">
      <MomoCheckout
        amount={25000}
        methods={methods}
        panels={{ card: cardPanel, wallet: walletPanel }}
        onPay={onPay}
        {...props}
      />
    </MboaProvider>
  )
  return { user, onPay: (props.onPay ?? onPay) as typeof onPay }
}

const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
const payButton = () => screen.getByRole("button", { name: /^Pay / })

describe("<MomoCheckout /> method panels", () => {
  beforeEach(() => {
    mockCardShouldFail = false
  })

  it("shows the method's panel instead of the phone field, and other methods are unaffected", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("radio", { name: /Bank card/ }))
    expect(screen.getByLabelText("Mock card")).toBeVisible()
    expect(screen.queryByRole("textbox", { name: /number/i })).toBeNull()

    await user.click(screen.getByRole("radio", { name: /MTN Mobile Money/ }))
    expect(screen.queryByLabelText("Mock card")).toBeNull()
    expect(screen.getByLabelText("MTN number")).toBeVisible()
  })

  it("does not pay until the panel says it is ready, and asks the customer to finish", async () => {
    const { user, onPay } = setup()
    await user.click(screen.getByRole("radio", { name: /Bank card/ }))
    await user.click(payButton())
    await flush()

    expect(onPay).not.toHaveBeenCalled()
    expect(screen.getByRole("alert")).toHaveTextContent("Complete the payment details")
  })

  it("collects the token when Pay is pressed and sends only the token as payload", async () => {
    const { user, onPay } = setup()
    await user.click(screen.getByRole("radio", { name: /Bank card/ }))
    await user.type(screen.getByLabelText("Mock card"), "4242")
    await user.click(payButton())
    await flush()

    expect(onPay).toHaveBeenCalledTimes(1)
    const [request] = onPay.mock.calls[0]!
    expect(request).toMatchObject({
      methodId: "card",
      amount: 25000,
      payload: { token: "tok_test_123" },
    })
    expect(request.phone).toBeUndefined()
  })

  it("keeps the payload out of the receipt", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("radio", { name: /Bank card/ }))
    await user.type(screen.getByLabelText("Mock card"), "4242")
    await user.click(payButton())
    await flush()

    const region = screen.getByRole("region", { name: "Payment received" })
    expect(region).toHaveTextContent("PAY-1")
    expect(region.textContent).not.toContain("tok_test_123")
  })

  it("pays nothing and shows the panel's own message when collecting the token fails", async () => {
    mockCardShouldFail = "with-message"
    const { user, onPay } = setup()
    await user.click(screen.getByRole("radio", { name: /Bank card/ }))
    await user.type(screen.getByLabelText("Mock card"), "4242")
    await user.click(payButton())
    await flush()

    expect(onPay).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Your card was declined.")
    )
    // The customer can fix it and try again.
    expect(payButton()).toBeEnabled()
  })

  it("shows a generic message when the panel fails without saying why", async () => {
    mockCardShouldFail = "silent"
    const { user, onPay } = setup()
    await user.click(screen.getByRole("radio", { name: /Bank card/ }))
    await user.type(screen.getByLabelText("Mock card"), "4242")
    await user.click(payButton())
    await flush()

    expect(onPay).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("could not read the payment details")
    )
  })

  it("resets the panel's readiness when the customer switches method and back", async () => {
    const { user, onPay } = setup()
    await user.click(screen.getByRole("radio", { name: /Bank card/ }))
    await user.type(screen.getByLabelText("Mock card"), "4242")
    await user.click(screen.getByRole("radio", { name: /MTN Mobile Money/ }))
    await user.click(screen.getByRole("radio", { name: /Bank card/ }))

    // A fresh panel starts empty, so it is not ready.
    expect(screen.getByLabelText("Mock card")).toHaveValue("")
    await user.click(payButton())
    await flush()
    expect(onPay).not.toHaveBeenCalled()
  })

  it("lets a panel start the payment itself and hides the Pay button", async () => {
    const { user, onPay } = setup()
    await user.click(screen.getByRole("radio", { name: /Digital wallet/ }))
    expect(screen.queryByRole("button", { name: /^Pay / })).toBeNull()

    await user.click(screen.getByRole("button", { name: /Wallet approve/ }))
    await flush()

    expect(onPay).toHaveBeenCalledTimes(1)
    expect(onPay).toHaveBeenCalledWith(
      expect.objectContaining({ methodId: "wallet", payload: { orderId: "ORDER-9" } })
    )
  })

  it("names the method on the receipt with the label you gave it", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("radio", { name: /Digital wallet/ }))
    await user.click(screen.getByRole("button", { name: /Wallet approve/ }))
    await flush()

    expect(screen.getByRole("region", { name: "Payment received" })).toHaveTextContent(
      "Digital wallet"
    )
  })

  it("gives a custom method an icon slot and hides an empty description", async () => {
    setup({
      methods: [...methods, { id: "voucher", kind: "other", label: "Voucher" }],
      methodIcons: { voucher: <span data-testid="voucher-icon" /> },
    })
    expect(screen.getByTestId("voucher-icon")).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Voucher" })).toBeInTheDocument()
  })
})

describe("<MomoCheckout /> configuration", () => {
  it("uses a custom submit label and can disable the button", () => {
    setup({ submitLabel: "Book now", submitDisabled: true })
    expect(screen.getByRole("button", { name: "Book now" })).toBeDisabled()
  })

  it("renders a footer under the Pay button", () => {
    setup({ footer: <a href="/terms">Terms of sale</a> })
    expect(screen.getByRole("link", { name: "Terms of sale" })).toBeVisible()
  })
})
