// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MboaProvider } from "@/components/mboa/mboa-provider"
import { UssdPrompt, type UssdPromptProps } from "@/components/mboa/ussd-prompt"
import { cm } from "@/lib/mboa/countries/cm"
import type { Locale } from "@/lib/mboa/countries/types"

const START = new Date("2026-01-01T12:00:00Z").getTime()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function setup(props: UssdPromptProps = {}, locale: Locale = "en") {
  const user = userEvent.setup({ delay: null })
  const utils = render(
    <MboaProvider country={cm} locale={locale}>
      <UssdPrompt {...props} />
    </MboaProvider>
  )
  return { user, ...utils }
}

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

const status = () => screen.getByRole("status")

describe("<UssdPrompt /> content", () => {
  it("shows the title, instructions, code and both actions", () => {
    setup({ code: "*126#", expiresAt: START + 90_000 })
    expect(screen.getByRole("heading", { name: "Approve the payment on your phone" })).toBeVisible()
    expect(screen.getByText(/dial the code below/i)).toBeVisible()
    expect(screen.getByLabelText("Approval code")).toHaveTextContent("*126#")
    expect(screen.getByRole("button", { name: "Copy code" })).toBeVisible()
    expect(screen.getByRole("link", { name: "Dial now" })).toHaveAttribute("href", "tel:*126%23")
  })

  it("encodes # in the dial link so the code is not cut off", () => {
    setup({ code: "#150*50#" })
    expect(screen.getByRole("link", { name: "Dial now" })).toHaveAttribute(
      "href",
      "tel:%23150*50%23"
    )
  })

  it("omits the code section when the operator pushes the prompt without a code", () => {
    setup({ expiresAt: START + 90_000 })
    expect(screen.queryByLabelText("Approval code")).toBeNull()
    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.queryByRole("button", { name: "Copy code" })).toBeNull()
    expect(status()).toHaveTextContent("Waiting for your approval…")
  })

  it("shows the code but no dial link when it is not dialable", () => {
    setup({ code: "call the office" })
    expect(screen.getByLabelText("Approval code")).toHaveTextContent("call the office")
    expect(screen.queryByRole("link")).toBeNull()
  })

  it("reminds the user which number the request went to", () => {
    setup({ phone: "+237651234567" })
    expect(screen.getByText("Request sent to +237 6 51 23 45 67.")).toBeVisible()
  })

  it("translates to French", () => {
    setup({ code: "*126#", expiresAt: START + 90_000 }, "fr")
    expect(
      screen.getByRole("heading", { name: "Validez le paiement sur votre téléphone" })
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Copier le code" })).toBeVisible()
    expect(status()).toHaveTextContent("En attente de votre validation…")
    expect(screen.getByText("Expire dans 1:30")).toBeInTheDocument()
  })
})

describe("<UssdPrompt /> countdown", () => {
  it("counts down every second", () => {
    setup({ expiresAt: START + 90_000 })
    expect(screen.getByText("Expires in 1:30")).toBeInTheDocument()
    advance(1_000)
    expect(screen.getByText("Expires in 1:29")).toBeInTheDocument()
    advance(29_000)
    expect(screen.getByText("Expires in 1:00")).toBeInTheDocument()
  })

  it("keeps the visual countdown out of the accessibility tree", () => {
    setup({ expiresAt: START + 90_000 })
    expect(screen.getByText("Expires in 1:30").closest("p")).toHaveAttribute("aria-hidden", "true")
  })

  it("only announces milestones, not every second", () => {
    const { container } = setup({ expiresAt: START + 130_000 })
    // The copy button has its own (empty) live region, so pick the one with text.
    const announcement = () =>
      Array.from(container.querySelectorAll(".sr-only[aria-live]"))
        .map((node) => node.textContent)
        .find(Boolean)

    expect(announcement()).toBe("Less than 3:00 left.")

    // 130 s -> 121 s stays in the same 3 minute milestone: nothing new is announced.
    advance(9_000)
    expect(announcement()).toBe("Less than 3:00 left.")

    // 121 s -> 120 s crosses into the 2 minute milestone.
    advance(1_000)
    expect(announcement()).toBe("Less than 2:00 left.")

    advance(60_000)
    expect(announcement()).toBe("Less than 1:00 left.")
  })

  it("announces in French", () => {
    const { container } = setup({ expiresAt: START + 45_000 }, "fr")
    const text = Array.from(container.querySelectorAll(".sr-only[aria-live]"))
      .map((node) => node.textContent)
      .find(Boolean)
    expect(text).toBe("Il reste moins de 1:00.")
  })
})

describe("<UssdPrompt /> timeout and retry", () => {
  it("switches to the timeout state when the countdown ends", () => {
    setup({ code: "*126#", expiresAt: START + 3_000, onRetry: () => {} })
    expect(status()).toHaveTextContent("Waiting for your approval…")

    advance(3_000)
    expect(status()).toHaveTextContent("The request expired.")
    expect(screen.queryByLabelText("Approval code")).toBeNull()
    expect(screen.queryByText(/Expires in/)).toBeNull()
    expect(document.querySelector("[data-slot=ussd-prompt]")).toHaveAttribute(
      "data-state",
      "expired"
    )
  })

  it("calls onExpire exactly once", () => {
    const onExpire = vi.fn()
    setup({ expiresAt: START + 3_000, onExpire })
    advance(10_000)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("shows a retry button after the timeout and calls onRetry", async () => {
    const onRetry = vi.fn()
    const { user } = setup({ expiresAt: START + 3_000, onRetry })
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull()

    advance(3_000)
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("has no retry button when onRetry is not given", () => {
    setup({ expiresAt: START + 3_000 })
    advance(3_000)
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull()
  })

  it("moves focus to the retry button if focus was inside when it expired", () => {
    setup({ code: "*126#", expiresAt: START + 3_000, onRetry: () => {} })
    screen.getByRole("button", { name: "Copy code" }).focus()
    advance(3_000)
    expect(screen.getByRole("button", { name: "Try again" })).toHaveFocus()
  })

  it("does not steal focus if it was elsewhere", () => {
    render(
      <MboaProvider country={cm} locale="en">
        <input aria-label="elsewhere" />
        <UssdPrompt expiresAt={START + 3_000} onRetry={() => {}} />
      </MboaProvider>
    )
    screen.getByLabelText("elsewhere").focus()
    advance(3_000)
    expect(screen.getByLabelText("elsewhere")).toHaveFocus()
  })

  it("restarts when given a new deadline", () => {
    const { rerender } = render(
      <MboaProvider country={cm} locale="en">
        <UssdPrompt code="*126#" expiresAt={START + 3_000} onRetry={() => {}} />
      </MboaProvider>
    )
    advance(3_000)
    expect(status()).toHaveTextContent("The request expired.")

    rerender(
      <MboaProvider country={cm} locale="en">
        <UssdPrompt code="*126#" expiresAt={START + 3_000 + 90_000} onRetry={() => {}} />
      </MboaProvider>
    )
    expect(status()).toHaveTextContent("Waiting for your approval…")
    expect(screen.getByText("Expires in 1:30")).toBeInTheDocument()
  })

  it("waits indefinitely without an expiry", () => {
    setup({ code: "*126#" })
    advance(600_000)
    expect(status()).toHaveTextContent("Waiting for your approval…")
    expect(screen.queryByText(/Expires in/)).toBeNull()
  })
})

describe("<UssdPrompt /> copy", () => {
  it("copies the code and confirms it", async () => {
    const { user } = setup({ code: "*126#" })
    // user-event installs its own clipboard on setup, so stub after it.
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", { clipboard: { writeText } })

    await user.click(screen.getByRole("button", { name: "Copy code" }))
    expect(writeText).toHaveBeenCalledWith("*126#")
    expect(await screen.findByRole("button", { name: "Code copied" })).toBeVisible()

    advance(2_000)
    expect(screen.getByRole("button", { name: "Copy code" })).toBeVisible()
  })

  it("says so when the code could not be copied", async () => {
    const { user } = setup({ code: "*126#" })
    vi.stubGlobal("navigator", {
      clipboard: { writeText: () => Promise.reject(new Error("denied")) },
    })
    Object.defineProperty(document, "execCommand", { value: () => false, configurable: true })

    await user.click(screen.getByRole("button", { name: "Copy code" }))
    expect(await screen.findByRole("button", { name: "Could not copy the code" })).toBeVisible()
  })
})

describe("<UssdPrompt /> styling", () => {
  it("lets you style each part with classNames and finds them by data-slot", () => {
    const { container } = setup({
      code: "*123#",
      phone: "+237651234567",
      expiresAt: START + 90_000,
      durationMs: 90_000,
      classNames: {
        indicator: "indicator-x",
        title: "title-x",
        phone: "phone-x",
        codeBox: "codebox-x",
        code: "code-x",
        status: "status-x",
        bar: "bar-x",
        countdown: "countdown-x",
      },
    })
    const slot = (name: string) => container.querySelector(`[data-slot="ussd-prompt-${name}"]`)
    expect(slot("indicator")).toHaveClass("indicator-x")
    expect(slot("title")).toHaveClass("title-x")
    expect(slot("phone")).toHaveClass("phone-x")
    expect(slot("code-box")).toHaveClass("codebox-x")
    expect(slot("code")).toHaveClass("code-x")
    expect(slot("status")).toHaveClass("status-x")
    expect(slot("bar")).toHaveClass("bar-x")
    expect(slot("countdown")).toHaveClass("countdown-x")
  })

  it("styles the retry button after a timeout", () => {
    const { container } = setup({
      expiresAt: START + 3_000,
      onRetry: () => {},
      classNames: { retry: "retry-x" },
    })
    advance(3_000)
    expect(container.querySelector('[data-slot="ussd-prompt-retry"]')).toHaveClass("retry-x")
  })

  it("never splits the phone number across two lines", () => {
    const { container } = setup({ phone: "+237651234567" })
    const text = container.querySelector('[data-slot="ussd-prompt-phone"]')?.textContent
    // No-break spaces between the groups keep the number in one piece.
    expect(text).toContain("+237\u00a06\u00a051\u00a023\u00a045\u00a067")
  })

  it("gives a single action the whole row when the code cannot be dialled", () => {
    const { container } = setup({ code: "call the office" })
    const actions = screen.getByRole("button", { name: "Copy code" }).parentElement
    expect(actions?.children).toHaveLength(1)
    expect(actions?.className).toContain("only-child:col-span-2")
    expect(container.querySelector("a")).toBeNull()
  })

  it("puts the copy and dial actions side by side, with equal width", () => {
    setup({ code: "*123#" })
    const copyButton = screen.getByRole("button", { name: "Copy code" })
    const dial = screen.getByRole("link", { name: "Dial now" })
    expect(copyButton.parentElement).toBe(dial.parentElement)
    expect(copyButton.parentElement?.className).toContain("grid-cols-2")
    expect(copyButton).toHaveClass("w-full")
    expect(dial).toHaveClass("w-full")
  })
})

describe("<UssdPrompt /> countdown bar", () => {
  const fill = () =>
    document.querySelector<HTMLElement>('[data-slot="ussd-prompt-bar"] > div') as HTMLElement

  it("starts full and shrinks with the time left", () => {
    setup({ expiresAt: START + 40_000, durationMs: 40_000 })
    expect(fill().style.transform).toBe("scaleX(1)")

    advance(10_000)
    expect(fill().style.transform).toBe("scaleX(0.75)")

    advance(20_000)
    expect(fill().style.transform).toBe("scaleX(0.25)")
  })

  it("is not shown without a duration, and is hidden from screen readers", () => {
    const { container, unmount } = setup({ expiresAt: START + 40_000 })
    expect(container.querySelector('[data-slot="ussd-prompt-bar"]')).toBeNull()
    unmount()

    setup({ expiresAt: START + 40_000, durationMs: 40_000 })
    expect(document.querySelector('[data-slot="ussd-prompt-bar"]')).toHaveAttribute(
      "aria-hidden",
      "true"
    )
  })

  it("does not animate for users who prefer reduced motion", () => {
    setup({ expiresAt: START + 40_000, durationMs: 40_000 })
    expect(fill().className).toContain("motion-reduce:transition-none")
  })

  it("disappears with the countdown when the time is up", () => {
    setup({ expiresAt: START + 3_000, durationMs: 3_000 })
    advance(3_000)
    expect(document.querySelector('[data-slot="ussd-prompt-bar"]')).toBeNull()
  })
})

describe("<UssdPrompt /> motion", () => {
  const indicator = () => document.querySelector('[data-slot="ussd-prompt-indicator"]')

  it("ripples around the phone icon while waiting, only when reduced motion is not requested", () => {
    setup({ expiresAt: START + 3_000 })
    expect(indicator()?.innerHTML).toContain("motion-safe:animate-ping")
    expect(indicator()?.querySelector("svg")).toBeInTheDocument()
  })

  it("stops rippling once expired, and keeps the icon", () => {
    setup({ expiresAt: START + 3_000 })
    advance(3_000)
    expect(indicator()?.innerHTML).not.toContain("animate-ping")
    expect(indicator()?.querySelector("svg")).toBeInTheDocument()
  })

  it("eases in, and only for users who have not asked for reduced motion", () => {
    setup({ expiresAt: START + 3_000 })
    const root = document.querySelector('[data-slot="ussd-prompt"]')
    expect(root?.className).toContain("motion-safe:animate-in")
  })

  it("hides the decorative indicator from screen readers", () => {
    setup({ expiresAt: START + 3_000 })
    expect(indicator()).toHaveAttribute("aria-hidden", "true")
  })
})
