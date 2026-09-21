import type { Metadata } from "next"

import { UssdDemo } from "@/app/docs/components/ussd-prompt/ussd-demo"
import { CodeBlock } from "@/components/site/code-block"
import { ComponentDoc } from "@/components/site/component-doc"
import type { PropRow } from "@/components/site/props-table"

export const metadata: Metadata = { title: "USSD prompt" }

const usage = `import { UssdPrompt } from "@/components/mpkit/ussd-prompt"

// Inside <MpKitProvider country={cm}>
const [expiresAt, setExpiresAt] = useState<number>()

// When your backend has started the payment:
setExpiresAt(Date.now() + 90_000)

{expiresAt && (
  <UssdPrompt
    code="*123#"                 // optional: shown with copy and dial actions
    phone="+237651234567"        // optional: "Request sent to +237 6 51 23 45 67."
    expiresAt={expiresAt}
    onExpire={() => console.log("timed out")}
    onRetry={() => {
      // start the payment again, then:
      setExpiresAt(Date.now() + 90_000)
    }}
  />
)}`

const hookUsage = `import { useCountdown } from "@/hooks/mpkit/use-countdown"

const remainingMs = useCountdown(expiresAt, { onExpire: () => console.log("done") })
// 0 once the time is up; pass null for "no countdown"`

const props: PropRow[] = [
  {
    name: "code",
    type: "string",
    description:
      'The USSD code to dial if the prompt does not reach the phone, such as "*123#". Leave it out when the operator pushes the prompt without a code. A "Dial now" link is added only if the code is dialable.',
  },
  {
    name: "expiresAt",
    type: "number",
    description:
      "When the request times out, as a Unix time in milliseconds. Starts the countdown. Without it the prompt waits indefinitely.",
  },
  {
    name: "durationMs",
    type: "number",
    description:
      "The total time allowed. Adds a bar that shrinks smoothly as time runs out. Without it there is only the countdown text.",
  },
  {
    name: "phone",
    type: "string",
    description: "The number the request was sent to, shown as a reminder. It never wraps.",
  },
  {
    name: "onRetry",
    type: "() => void",
    description:
      "Called when the user presses “Try again” after the timeout. No button without it.",
  },
  {
    name: "onExpire",
    type: "() => void",
    description: "Called once when the countdown reaches zero.",
  },
  {
    name: "country",
    type: "CountryConfig",
    default: "MpKitProvider's country",
    description: "Only used to format phone.",
  },
  {
    name: "locale",
    type: '"fr" | "en"',
    default: "MpKitProvider's locale, then “fr”",
    description: "Language of the prompt.",
  },
  {
    name: "classNames",
    type: "{ indicator, title, phone, codeBox, code, status, bar, countdown, retry }",
    description:
      "Class names for parts of the prompt. Each part also has a data-slot attribute, such as ussd-prompt-code.",
  },
  {
    name: "...props",
    type: "ComponentProps<'section'>",
    description: "Other section props, such as className.",
  },
]

export default function UssdPromptPage() {
  return (
    <ComponentDoc
      name="ussd-prompt"
      title="USSD prompt"
      description="Asks the user to approve a Mobile Money payment on their phone. It shows the approval code with copy and dial actions, an animated waiting state, a countdown, and a retry button once the request times out."
      preview={<UssdDemo />}
      usage={usage}
      props={props}
    >
      <section aria-labelledby="hook" className="space-y-3">
        <h2 id="hook" className="text-xl font-semibold">
          useCountdown
        </h2>
        <p className="text-muted-foreground max-w-prose">
          The countdown is a separate hook, installed with the prompt. It works out the time left
          from the real clock instead of counting ticks, so it stays correct when the browser
          throttles timers, and it re-syncs the moment the tab is visible again. That matters on
          phones: people leave the page to dial, and mobile browsers pause background tabs.
        </p>
        <CodeBlock label="useCountdown usage" code={hookUsage} />
      </section>

      <section aria-labelledby="notes" className="space-y-3">
        <h2 id="notes" className="text-xl font-semibold">
          Notes
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            <strong>State only.</strong> The prompt never calls a payment API. You start the
            payment, poll for the result and decide the outcome. The checkout block does that for
            you.
          </li>
          <li>
            <strong>Accessible countdown.</strong> The ticking numbers are hidden from screen
            readers. A polite live region announces milestones instead: each minute, then at 60, 30
            and 10 seconds.
          </li>
          <li>
            <strong>Motion.</strong> While waiting, a ring ripples out from the phone icon and the
            bar shrinks smoothly. Both are skipped for users who have asked for reduced motion. The
            icon and the countdown text stay.
          </li>
          <li>
            <strong>Focus.</strong> If keyboard focus was on the copy button when the request timed
            out, it moves to “Try again” instead of being dropped.
          </li>
          <li>
            <strong>Dial link.</strong> It uses <code>tel:</code> with <code>#</code> encoded as{" "}
            <code>%23</code>, so the code is not cut off. It only appears for text that is a
            dialable code. On a desktop browser it opens whatever handles phone links, if anything.
          </li>
          <li>
            <strong>Copy.</strong> Uses the Clipboard API and falls back to a hidden textarea for
            older Android browsers and pages served over http.
          </li>
          <li>
            A late approval on the phone after the timeout is not something this component can know
            about. Tell users what happens, or keep polling your backend.
          </li>
        </ul>
      </section>
    </ComponentDoc>
  )
}
