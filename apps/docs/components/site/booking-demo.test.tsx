// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { BookingDemo } from "@/components/site/booking-demo"

const START = new Date("2026-01-01T12:00:00Z").getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
})

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })

function setup() {
  const user = userEvent.setup({ delay: null })
  render(<BookingDemo />)
  return user
}

const checkout = () => screen.getByRole("region", { name: /Votre réservation|Your booking/ })
const nightsOutput = () => document.querySelector("output")?.textContent
const moreButton = () => screen.getByRole("button", { name: /Une nuit de plus|One night more/ })
const fewerButton = () => screen.getByRole("button", { name: /Une nuit de moins|One night fewer/ })
const payButton = () => screen.getByRole("button", { name: /^(Payer|Pay) / })
const radio = (name: RegExp) => screen.getByRole("radio", { name })

/** Chooses MTN Mobile Money, types a valid number and presses Pay (French UI). */
async function payWithMtn(user: ReturnType<typeof userEvent.setup>) {
  await user.click(radio(/MTN Mobile Money/))
  await user.type(screen.getByLabelText("Numéro MTN"), "651234567")
  await user.click(payButton())
}

async function chooseScenario(user: ReturnType<typeof userEvent.setup>, value: string) {
  await user.click(screen.getByText("Essayer les cas d'échec"))
  await user.selectOptions(
    screen.getByLabelText("Que fait l'utilisateur sur son téléphone ?"),
    value
  )
}

describe("<BookingDemo /> the order", () => {
  it("starts with a listing, two nights and the total in FCFA", () => {
    setup()
    expect(screen.getByRole("heading", { name: "Studio meublé à Bastos" })).toBeVisible()
    expect(nightsOutput()).toBe("2")
    expect(checkout()).toHaveTextContent(/50\s000\sFCFA/)
    expect(payButton()).toHaveTextContent(/Payer 50\s000\sFCFA/)
  })

  it("shows the nightly price", () => {
    setup()
    expect(screen.getAllByText(/25\s000\sFCFA/).length).toBeGreaterThan(0)
    expect(screen.getByText("par nuit")).toBeVisible()
  })

  it("updates the total as the nights change", async () => {
    const user = setup()
    await user.click(moreButton())
    expect(nightsOutput()).toBe("3")
    expect(payButton()).toHaveTextContent(/Payer 75\s000\sFCFA/)

    await user.click(fewerButton())
    await user.click(fewerButton())
    expect(nightsOutput()).toBe("1")
    expect(payButton()).toHaveTextContent(/Payer 25\s000\sFCFA/)
  })

  it("stops at the minimum and the maximum number of nights", async () => {
    const user = setup()
    await user.click(fewerButton())
    expect(fewerButton()).toBeDisabled()
    expect(nightsOutput()).toBe("1")

    for (let i = 0; i < 20; i++)
      if (!moreButton().hasAttribute("disabled")) await user.click(moreButton())
    expect(nightsOutput()).toBe("14")
    expect(moreButton()).toBeDisabled()
    expect(payButton()).toHaveTextContent(/Payer 350\s000\sFCFA/)
  })

  it("groups the stepper under a label", () => {
    setup()
    expect(screen.getByRole("group", { name: "Nuits" })).toBeVisible()
  })
})

describe("<BookingDemo /> language", () => {
  it("switches everything to English, including the number format", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "EN" }))

    expect(screen.getByRole("heading", { name: "Furnished studio in Bastos" })).toBeVisible()
    expect(screen.getByRole("group", { name: "Nights" })).toBeVisible()
    expect(checkout()).toHaveTextContent("Your booking")
    expect(payButton()).toHaveTextContent(/Pay 50,000\sFCFA/)
    expect(screen.getByText("Demo: no real payment is made.")).toBeVisible()
  })

  it("switches back to French", async () => {
    const user = setup()
    await user.click(screen.getByRole("button", { name: "EN" }))
    await user.click(screen.getByRole("button", { name: "FR" }))
    expect(payButton()).toHaveTextContent(/Payer 50\s000\sFCFA/)
  })

  it("keeps the nights when the language changes", async () => {
    const user = setup()
    await user.click(moreButton())
    await user.click(screen.getByRole("button", { name: "EN" }))
    expect(nightsOutput()).toBe("3")
    expect(payButton()).toHaveTextContent(/Pay 75,000\sFCFA/)
  })
})

describe("<BookingDemo /> paying", () => {
  it("pays with cash and shows a receipt for this booking", async () => {
    const user = setup()
    await user.click(radio(/Espèces/))
    await user.click(payButton())
    await advance(600)

    const receipt = screen.getByRole("region", { name: "Paiement reçu" })
    expect(receipt).toHaveTextContent(/50\s000\sFCFA/)
    expect(receipt).toHaveTextContent("Studio meublé à Bastos")
    expect(receipt).toHaveTextContent("2 nuits")
    expect(receipt).toHaveTextContent("DEMO-0001")
  })

  it("pays with Mobile Money after the fake approval delay", async () => {
    const user = setup()
    await payWithMtn(user)
    await advance(600)

    expect(
      screen.getByRole("heading", { name: "Validez le paiement sur votre téléphone" })
    ).toBeVisible()
    expect(screen.getByLabelText("Code de validation")).toHaveTextContent("*123#")
    expect(screen.queryByRole("region", { name: "Paiement reçu" })).toBeNull()

    await advance(7_000)
    const receipt = screen.getByRole("region", { name: "Paiement reçu" })
    expect(receipt).toHaveTextContent("MTN Mobile Money")
    expect(receipt).toHaveTextContent("+237 6 51 23 45 67")
  })

  it("locks the order while a payment is in progress, and unlocks it afterwards", async () => {
    const user = setup()
    await user.click(radio(/Espèces/))
    await user.click(payButton())
    await advance(0)

    expect(moreButton()).toBeDisabled()
    expect(fewerButton()).toBeDisabled()
    expect(screen.getByText("Le séjour est verrouillé pendant le paiement.")).toBeVisible()

    await advance(600)
    // Still locked while the receipt is showing.
    expect(moreButton()).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Terminé" }))
    expect(moreButton()).toBeEnabled()
    expect(screen.queryByText("Le séjour est verrouillé pendant le paiement.")).toBeNull()
  })

  it("charges the amount that was on screen when the customer pressed Pay", async () => {
    const user = setup()
    await user.click(moreButton()) // 3 nights
    await user.click(radio(/Espèces/))
    await user.click(payButton())
    await advance(600)
    expect(screen.getByRole("region", { name: "Paiement reçu" })).toHaveTextContent(/75\s000\sFCFA/)
  })

  it("does not let the total change under a payment", async () => {
    const user = setup()
    await user.click(radio(/Espèces/))
    await user.click(payButton())
    await advance(0)
    // The stepper is disabled, so a click cannot change the amount.
    await user.click(moreButton())
    expect(nightsOutput()).toBe("2")
  })
})

describe("<BookingDemo /> failure cases", () => {
  it("shows a translated message when the user declines", async () => {
    const user = setup()
    await chooseScenario(user, "decline")
    await payWithMtn(user)
    await advance(8_000)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Paiement non abouti")
    expect(alert).toHaveTextContent("Vous avez refusé la demande sur votre téléphone.")
  })

  it("stays locked after a failure until the customer goes back", async () => {
    const user = setup()
    await chooseScenario(user, "decline")
    await payWithMtn(user)
    await advance(8_000)
    expect(moreButton()).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Changer de moyen de paiement" }))
    expect(moreButton()).toBeEnabled()
  })

  it("times out when the user never answers, and warns about paying twice", async () => {
    const user = setup()
    await chooseScenario(user, "timeout")
    await payWithMtn(user)
    await advance(31_000)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Demande expirée")
    expect(alert).toHaveTextContent("Vous avez déjà validé le paiement")
  })

  it("fails when the payment provider errors, without showing the technical message", async () => {
    const user = setup()
    await chooseScenario(user, "error")
    await payWithMtn(user)
    await advance(2_000)

    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Paiement non abouti")
    expect(screen.queryByText(/Demo gateway error/)).toBeNull()
  })

  it("can try again after a failure and succeed", async () => {
    const user = setup()
    await chooseScenario(user, "error")
    await payWithMtn(user)
    await advance(2_000)
    expect(screen.getByRole("alert")).toBeVisible()

    await chooseScenario(user, "approve")
    await user.click(screen.getByRole("button", { name: "Réessayer" }))
    await advance(8_000)
    expect(screen.getByRole("region", { name: "Paiement reçu" })).toBeVisible()
  })
})
