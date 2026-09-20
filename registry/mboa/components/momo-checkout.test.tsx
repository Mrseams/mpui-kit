// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MboaProvider } from "@/components/mboa/mboa-provider"
import { MomoCheckout, type MomoCheckoutProps } from "@/components/mboa/momo-checkout"
import type { PayResult, StatusResult } from "@/hooks/mboa/use-momo-checkout"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"

const START = new Date("2026-01-01T12:00:00Z").getTime()

type OnPay = NonNullable<MomoCheckoutProps["onPay"]>
type OnCheck = NonNullable<MomoCheckoutProps["onCheckStatus"]>

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function setup(props: Partial<MomoCheckoutProps> = {}, locale: Locale = "en") {
  const onPay = vi.fn<OnPay>().mockResolvedValue({ status: "success", reference: "PAY-1" })
  const user = userEvent.setup({ delay: null })
  const utils = render(
    <MboaProvider country={cm} locale={locale}>
      <MomoCheckout amount={25000} pollIntervalMs={1_000} onPay={onPay} {...props} />
    </MboaProvider>
  )
  return { user, onPay: (props.onPay ?? onPay) as typeof onPay, ...utils }
}

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })

const radio = (name: RegExp | string) => screen.getByRole("radio", { name })
const payButton = () => screen.getByRole("button", { name: /^(Pay|Payer) / })
const pending = (reference = "R1", ussdCode?: string): PayResult => ({
  status: "pending",
  reference,
  ussdCode,
})

/** Chooses MTN, types a valid number and presses Pay. */
async function payWithMtn(user: ReturnType<typeof userEvent.setup>, number = "651234567") {
  await user.click(radio(/MTN Mobile Money/))
  await user.type(screen.getByLabelText("MTN number"), number)
  await user.click(payButton())
}

describe("<MomoCheckout /> layout", () => {
  it("is a named region with the total and a pay button", () => {
    setup()
    const region = screen.getByRole("region", { name: "Checkout" })
    expect(within(region).getByText("Total")).toBeVisible()
    expect(within(region).getAllByText(/25,000\sFCFA/).length).toBeGreaterThan(0)
    expect(payButton()).toHaveTextContent(/Pay 25,000\sFCFA/)
  })

  it("translates to French, with French digit grouping", () => {
    setup({}, "fr")
    expect(screen.getByRole("region", { name: "Paiement" })).toBeVisible()
    expect(payButton()).toHaveTextContent(/Payer 25\s000\sFCFA/)
  })

  it("shows a custom title and summary", () => {
    setup({ title: "Book your stay", summary: <span>3 nights in Bastos</span> })
    expect(screen.getByRole("region", { name: "Book your stay" })).toBeVisible()
    expect(screen.getByText("3 nights in Bastos")).toBeVisible()
  })

  it("offers only the given methods", () => {
    setup({ methods: [{ id: "cash", kind: "cash" }] })
    expect(screen.getAllByRole("radio")).toHaveLength(1)
  })

  it("throws a helpful error when there is no country", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<MomoCheckout amount={1000} onPay={vi.fn()} />)).toThrow(/no country set/)
  })
})

describe("<MomoCheckout /> validation on submit", () => {
  it("asks for a method and focuses the cards when none is chosen", async () => {
    const { user, onPay } = setup()
    await user.click(payButton())

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a payment method to continue.")
    expect(screen.getAllByRole("radio")[0]).toHaveFocus()
    expect(onPay).not.toHaveBeenCalled()
  })

  it("asks for a number and focuses the phone field for Mobile Money", async () => {
    const { user, onPay } = setup()
    await user.click(radio(/MTN Mobile Money/))
    await user.click(payButton())

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a phone number.")
    expect(screen.getByLabelText("MTN number")).toHaveFocus()
    expect(onPay).not.toHaveBeenCalled()
  })

  it("rejects a number from another operator", async () => {
    const { user, onPay } = setup()
    await user.click(radio(/MTN Mobile Money/))
    await user.type(screen.getByLabelText("MTN number"), "655123456")
    await user.click(payButton())

    expect(screen.getByRole("alert")).toHaveTextContent("This number does not belong to MTN.")
    expect(onPay).not.toHaveBeenCalled()
  })

  it("clears the error once it is fixed", async () => {
    const { user } = setup()
    await user.click(radio(/MTN Mobile Money/))
    await user.click(payButton())
    expect(screen.getByRole("alert")).toBeVisible()

    await user.type(screen.getByLabelText("MTN number"), "651234567")
    expect(screen.queryByRole("alert")).toBeNull()
  })
})

describe("<MomoCheckout /> paying with cash", () => {
  it("calls onPay, shows progress, then the receipt", async () => {
    const slow = deferred<PayResult>()
    const onPay = vi.fn<OnPay>().mockReturnValue(slow.promise)
    const onSuccess = vi.fn()
    const { user } = setup({ onPay, onSuccess })

    await user.click(radio(/Cash/))
    await user.click(payButton())
    await advance(0)

    expect(onPay).toHaveBeenCalledTimes(1)
    expect(onPay.mock.calls[0][0]).toMatchObject({
      methodId: "cash",
      amount: 25000,
      currency: "XAF",
      attempt: 1,
    })
    expect(onPay.mock.calls[0][0].phone).toBeUndefined()
    expect(screen.getByRole("status")).toHaveTextContent("Sending the request…")
    expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible()
    expect(screen.queryByRole("radio")).toBeNull()

    slow.resolve({ status: "success", reference: "CASH-77" })
    await advance(0)

    const receipt = screen.getByRole("region", { name: "Payment received" })
    expect(receipt).toHaveTextContent("CASH-77")
    expect(receipt).toHaveTextContent("Cash")
    expect(receipt).toHaveFocus()
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ reference: "CASH-77", methodId: "cash", amount: 25000 })
    )
  })

  it("only calls onPay once for a double click", async () => {
    const { user, onPay } = setup({ onPay: vi.fn<OnPay>().mockReturnValue(new Promise(() => {})) })
    await user.click(radio(/Cash/))
    await user.dblClick(payButton())
    await advance(0)
    expect(onPay).toHaveBeenCalledTimes(1)
  })
})

describe("<MomoCheckout /> paying with Mobile Money", () => {
  it("shows the USSD prompt, polls for approval and then the receipt", async () => {
    const onPay = vi.fn<OnPay>().mockResolvedValue(pending("MOMO-9", "*123#"))
    const onCheckStatus = vi
      .fn<OnCheck>()
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "success" })
    const { user } = setup({ onPay, onCheckStatus })

    await payWithMtn(user)
    await advance(0)

    expect(onPay.mock.calls[0][0]).toMatchObject({ methodId: "mtn", phone: "+237651234567" })
    expect(screen.getByRole("heading", { name: "Approve the payment on your phone" })).toBeVisible()
    expect(screen.getByText("Request sent to +237 6 51 23 45 67.")).toBeVisible()
    expect(screen.getByLabelText("Approval code")).toHaveTextContent("*123#")
    expect(screen.getByText(/Expires in 2:00/)).toBeInTheDocument()

    await advance(1_000)
    expect(screen.queryByRole("region", { name: "Payment received" })).toBeNull()
    await advance(1_000)

    const receipt = screen.getByRole("region", { name: "Payment received" })
    expect(receipt).toHaveTextContent("MOMO-9")
    expect(receipt).toHaveTextContent("MTN Mobile Money")
    expect(receipt).toHaveTextContent("+237 6 51 23 45 67")
    expect(onCheckStatus.mock.calls[0][0]).toBe("MOMO-9")
  })

  it("shows the prompt at once for a backend that answers only after approval", async () => {
    const approval = deferred<PayResult>()
    const { user } = setup({ onPay: vi.fn<OnPay>().mockReturnValue(approval.promise) })
    await payWithMtn(user)
    await advance(0)

    expect(screen.getByRole("heading", { name: "Approve the payment on your phone" })).toBeVisible()
    expect(screen.queryByLabelText("Approval code")).toBeNull() // no code from this backend

    approval.resolve({ status: "success", reference: "PAY-2" })
    await advance(0)
    expect(screen.getByRole("region", { name: "Payment received" })).toHaveTextContent("PAY-2")
  })

  it("shows extra receipt details", async () => {
    const { user } = setup({ receiptDetails: [{ label: "Apartment", value: "Studio, Bastos" }] })
    await payWithMtn(user)
    await advance(0)
    expect(screen.getByRole("region", { name: "Payment received" })).toHaveTextContent(
      "Studio, Bastos"
    )
  })
})

describe("<MomoCheckout /> cancel and done", () => {
  it("cancel goes back to the form and keeps the choices", async () => {
    const { user } = setup({ onPay: vi.fn<OnPay>().mockResolvedValue(pending()) })
    await payWithMtn(user)
    await advance(0)
    expect(screen.queryByRole("radio")).toBeNull()

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(radio(/MTN Mobile Money/)).toBeChecked()
    expect(screen.getByLabelText("MTN number")).toHaveValue("6 51 23 45 67")
    expect(radio(/MTN Mobile Money/)).toHaveFocus()
  })

  it("done calls onDone and starts over with nothing chosen", async () => {
    const onDone = vi.fn()
    const { user } = setup({ onDone })
    await user.click(radio(/Cash/))
    await user.click(payButton())
    await advance(0)

    await user.click(screen.getByRole("button", { name: "Done" }))

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("region", { name: "Payment received" })).toBeNull()
    for (const item of screen.getAllByRole("radio")) expect(item).not.toBeChecked()
  })
})

describe("<MomoCheckout /> failure", () => {
  it("shows a generic message and tells the app why it failed", async () => {
    const onFailure = vi.fn()
    const onPay = vi.fn<OnPay>().mockResolvedValue({ status: "failed", reason: "ERR_4021_GATEWAY" })
    const { user } = setup({ onPay, onFailure })
    await user.click(radio(/Cash/))
    await user.click(payButton())
    await advance(0)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Payment not completed")
    expect(alert).toHaveTextContent("The payment was declined or could not be processed.")
    expect(alert).toHaveFocus()
    expect(onFailure).toHaveBeenCalledWith("ERR_4021_GATEWAY")
    // Raw backend text is never shown to the customer.
    expect(screen.queryByText(/ERR_4021_GATEWAY/)).toBeNull()
  })

  it("never shows the message of a thrown error", async () => {
    const onPay = vi.fn<OnPay>().mockRejectedValue(new Error("ECONNRESET at 10.0.0.4"))
    const { user } = setup({ onPay })
    await user.click(radio(/Cash/))
    await user.click(payButton())
    await advance(0)
    expect(screen.queryByText(/ECONNRESET/)).toBeNull()
    expect(screen.getByRole("alert")).toHaveTextContent("Payment not completed")
  })

  it("shows your message for a reason you have mapped", async () => {
    const onPay = vi
      .fn<OnPay>()
      .mockResolvedValue({ status: "failed", reason: "insufficient_funds" })
    const { user } = setup({
      onPay,
      failureMessages: { insufficient_funds: "Your balance is too low." },
    })
    await user.click(radio(/Cash/))
    await user.click(payButton())
    await advance(0)
    expect(screen.getByRole("alert")).toHaveTextContent("Your balance is too low.")
  })

  it("try again pays again with the same details", async () => {
    const onPay = vi
      .fn<OnPay>()
      .mockResolvedValueOnce({ status: "failed" })
      .mockResolvedValueOnce({ status: "success", reference: "PAY-2" })
    const { user } = setup({ onPay })
    await payWithMtn(user)
    await advance(0)

    await user.click(screen.getByRole("button", { name: "Try again" }))
    await advance(0)

    expect(onPay).toHaveBeenCalledTimes(2)
    expect(onPay.mock.calls[1][0]).toMatchObject({
      methodId: "mtn",
      phone: "+237651234567",
      attempt: 2,
    })
    expect(screen.getByRole("region", { name: "Payment received" })).toHaveTextContent("PAY-2")
  })

  it("change payment method returns to the form with the choices kept", async () => {
    const onPay = vi.fn<OnPay>().mockResolvedValue({ status: "failed" })
    const { user } = setup({ onPay })
    await payWithMtn(user)
    await advance(0)

    await user.click(screen.getByRole("button", { name: "Change payment method" }))

    expect(radio(/MTN Mobile Money/)).toBeChecked()
    expect(radio(/MTN Mobile Money/)).toHaveFocus()
    expect(screen.queryByRole("alert")).toBeNull()
  })
})

describe("<MomoCheckout /> timeout", () => {
  it("times out, warns not to pay twice, and can try again", async () => {
    const onFailure = vi.fn()
    const onPay = vi.fn<OnPay>().mockResolvedValue(pending("R1", "*123#"))
    const onCheckStatus = vi.fn<OnCheck>().mockResolvedValue({ status: "pending" })
    const { user } = setup({ onPay, onCheckStatus, onFailure, timeoutMs: 5_000 })
    await payWithMtn(user)
    await advance(0)
    expect(screen.getByRole("heading", { name: "Approve the payment on your phone" })).toBeVisible()

    await advance(5_000)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Request expired")
    expect(alert).toHaveTextContent("Already approved the payment on your phone?")
    expect(alert).toHaveFocus()
    expect(onFailure).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Try again" }))
    await advance(0)
    expect(onPay).toHaveBeenCalledTimes(2)
    expect(onPay.mock.calls[1][0].attempt).toBe(2)
    expect(screen.getByRole("heading", { name: "Approve the payment on your phone" })).toBeVisible()
    expect(screen.getByText(/Expires in 0:05/)).toBeInTheDocument()
  })

  it("does not accept an approval that arrives after the timeout", async () => {
    const slow = deferred<PayResult>()
    const { user } = setup({
      onPay: vi.fn<OnPay>().mockReturnValue(slow.promise),
      timeoutMs: 5_000,
    })
    await payWithMtn(user)
    await advance(5_000)
    expect(screen.getByRole("alert")).toHaveTextContent("Request expired")

    slow.resolve({ status: "success", reference: "LATE" })
    await advance(0)
    expect(screen.queryByRole("region", { name: "Payment received" })).toBeNull()
    expect(screen.getByRole("alert")).toHaveTextContent("Request expired")
  })
})

describe("<MomoCheckout /> styling", () => {
  it("lets you style the form parts and finds them by data-slot", () => {
    const { container } = setup({
      summary: "3 nights",
      classNames: {
        title: "title-x",
        summary: "summary-x",
        total: "total-x",
        amount: "amount-x",
        form: "form-x",
        submit: "submit-x",
        picker: "picker-x",
      },
    })
    const slot = (name: string) => container.querySelector(`[data-slot="momo-checkout-${name}"]`)
    expect(slot("title")).toHaveClass("title-x")
    expect(slot("summary")).toHaveClass("summary-x")
    expect(slot("total")).toHaveClass("total-x")
    expect(slot("amount")).toHaveClass("amount-x")
    expect(slot("form")).toHaveClass("form-x")
    expect(slot("submit")).toHaveClass("submit-x")
    expect(container.querySelector('[data-slot="payment-method-picker"]')).toHaveClass("picker-x")
  })

  it("styles the prompt and the cancel button while waiting", async () => {
    const onPay = vi.fn<OnPay>().mockResolvedValue(pending())
    const { user, container } = setup({
      onPay,
      classNames: { prompt: "prompt-x", cancel: "cancel-x" },
    })
    await payWithMtn(user)
    await advance(0)
    expect(container.querySelector('[data-slot="ussd-prompt"]')).toHaveClass("prompt-x")
    expect(container.querySelector('[data-slot="momo-checkout-cancel"]')).toHaveClass("cancel-x")
  })

  it("styles the receipt and the failure panel", async () => {
    const success = setup({ classNames: { receipt: "receipt-x" } })
    await success.user.click(radio(/Cash/))
    await success.user.click(payButton())
    await advance(0)
    expect(success.container.querySelector('[data-slot="receipt-card"]')).toHaveClass("receipt-x")
    success.unmount()

    const failed = setup({
      onPay: vi.fn<OnPay>().mockResolvedValue({ status: "failed" }),
      classNames: { failure: "failure-x" },
    })
    await failed.user.click(radio(/Cash/))
    await failed.user.click(payButton())
    await advance(0)
    expect(failed.container.querySelector('[data-slot="momo-checkout-failure"]')).toHaveClass(
      "failure-x"
    )
  })
})

describe("<MomoCheckout /> callbacks", () => {
  it("calls onSuccess only once, even when the parent re-renders", async () => {
    const onSuccess = vi.fn()
    const props = {
      amount: 25000,
      onPay: vi.fn<OnPay>().mockResolvedValue({ status: "success", reference: "P" }),
      onSuccess,
    }
    const user = userEvent.setup({ delay: null })
    const { rerender } = render(
      <MboaProvider country={cm} locale="en">
        <MomoCheckout {...props} />
      </MboaProvider>
    )
    await user.click(radio(/Cash/))
    await user.click(payButton())
    await advance(0)
    expect(onSuccess).toHaveBeenCalledTimes(1)

    rerender(
      <MboaProvider country={cm} locale="en">
        <MomoCheckout {...props} title="Renamed" />
      </MboaProvider>
    )
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it("passes an unresolved status check through to a receipt reference", async () => {
    const onPay = vi.fn<OnPay>().mockResolvedValue(pending("R1"))
    const onCheckStatus = vi
      .fn<OnCheck>()
      .mockResolvedValue({ status: "success", reference: "TX-42" } satisfies StatusResult)
    const { user } = setup({ onPay, onCheckStatus })
    await payWithMtn(user)
    await advance(1_000)
    expect(screen.getByRole("region", { name: "Payment received" })).toHaveTextContent("TX-42")
  })
})
