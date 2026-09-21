import type { Metadata } from "next"

import { CodeBlock } from "@/components/site/code-block"

export const metadata: Metadata = { title: "Headless and framework-free" }

const layers = [
  {
    name: "Core",
    what: "Controllers and pure helpers with no UI and no dependencies: createCheckoutController, createPhoneField, createCountdown, formatFcfa, validatePhone, the FR/EN dictionary and the Cameroon data.",
    where: "registry/mpkit/lib, and the @mpkit/core npm package built from it",
  },
  {
    name: "Hooks",
    what: "Thin React wrappers over the core: useMomoCheckout, usePhoneField, useCountdown. They render nothing, so you bring your own markup.",
    where: "registry/mpkit/hooks",
  },
  {
    name: "Components",
    what: "The shadcn/ui components, built on the hooks.",
    where: "registry/mpkit/components",
  },
]

const plain = `import { cm, createCheckoutController, createPhoneField, formatFcfa } from "@mpkit/core"

const field = createPhoneField({ country: cm })
input.addEventListener("input", () => {
  const { formatted, caretIndex } = field.input(input.value, input.selectionStart ?? undefined)
  input.value = formatted
  if (caretIndex !== null) input.setSelectionRange(caretIndex, caretIndex)
})

const checkout = createCheckoutController({
  amount: 25000,
  currency: "XAF",
  onPay: async ({ methodId, phone, payload }) => {
    // Call YOUR backend. MP Kit never talks to a payment provider.
    const { reference } = await startPayment({ methodId, phone, payload })
    return { status: "pending", reference }
  },
  onCheckStatus: async (reference) => fetchStatus(reference),
})

checkout.subscribe(() => render(checkout.getSnapshot()))
checkout.pay({ methodId: "mtn", phone: field.getSnapshot().validation.e164 })`

const vue = `// SKETCH: not run in this repository.
import { shallowRef, onUnmounted } from "vue"

export function useCheckout(options) {
  const controller = createCheckoutController(options)
  const snapshot = shallowRef(controller.getSnapshot())
  const stop = controller.subscribe(() => (snapshot.value = controller.getSnapshot()))
  onUnmounted(() => {
    stop()
    controller.destroy()
  })
  return { snapshot, pay: controller.pay, retry: controller.retry, cancel: controller.cancel }
}`

const svelte = `// SKETCH: not run in this repository.
// Svelte calls the callback with the current value straight away, so wrap getSnapshot.
import { readable } from "svelte/store"

const snapshot = readable(controller.getSnapshot(), (set) =>
  controller.subscribe(() => set(controller.getSnapshot()))
)`

const react = `import { useSyncExternalStore } from "react"

const { state } = useSyncExternalStore(checkout.subscribe, checkout.getSnapshot)`

export default function HeadlessPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Headless and framework-free</h1>
        <p className="text-muted-foreground max-w-prose">
          The checkout logic does not depend on React or on any UI. Use it with Vue, Svelte, Solid
          or plain JavaScript, or build your own React interface on the hooks.
        </p>
      </header>

      <section aria-labelledby="layers" className="space-y-3">
        <h2 id="layers" className="text-xl font-semibold">
          Three layers
        </h2>
        <ul className="divide-y rounded-lg border">
          {layers.map((layer) => (
            <li key={layer.name} className="space-y-1 p-4">
              <p className="font-medium">{layer.name}</p>
              <p className="text-muted-foreground text-sm text-pretty">{layer.what}</p>
              <p className="text-muted-foreground text-xs">{layer.where}</p>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground max-w-prose">
          Every controller has the same small shape: <code>getSnapshot()</code> returns the current
          state (the same object until something changes) and <code>subscribe(listener)</code> tells
          you when it changes. That is exactly what <code>useSyncExternalStore</code>, a Vue{" "}
          <code>shallowRef</code>, a Svelte store or a plain <code>render()</code> need.
        </p>
      </section>

      <section aria-labelledby="demo" className="space-y-3">
        <h2 id="demo" className="text-xl font-semibold">
          Plain JavaScript, running
        </h2>
        <p className="text-muted-foreground max-w-prose">
          This page loads no React and no framework. It is a single HTML file that imports the core
          bundle, with a simulated payment. It is also checked in a real browser in this repository.
        </p>
        <iframe
          title="MP Kit core in plain JavaScript"
          src="/examples/vanilla.html"
          className="bg-background h-[36rem] w-full rounded-lg border"
          loading="lazy"
        />
        <CodeBlock label="Plain JavaScript" code={plain} />
      </section>

      <section aria-labelledby="frameworks" className="space-y-3">
        <h2 id="frameworks" className="text-xl font-semibold">
          React, Vue and Svelte
        </h2>
        <CodeBlock label="React" code={react} />
        <p className="text-muted-foreground max-w-prose">
          The Vue and Svelte adapters below are sketches.{" "}
          <strong>They are not run in this repository&apos;s tests</strong>, but the controller does
          the same thing in every framework, so only the wiring differs.
        </p>
        <CodeBlock label="Vue 3 sketch" code={vue} />
        <CodeBlock label="Svelte sketch" code={svelte} />
      </section>

      <section aria-labelledby="package" className="space-y-3">
        <h2 id="package" className="text-xl font-semibold">
          The npm package
        </h2>
        <p className="text-muted-foreground max-w-prose">
          <code>@mpkit/core</code> is built from the same source as the registry, as ESM and
          CommonJS with type declarations. <strong>It is not published yet.</strong> The package
          name and scope are provisional until the project has its own npm scope. Country data is
          community data, not an authoritative source.
        </p>
        <p className="text-muted-foreground max-w-prose">
          The core never calls a payment provider and never asks for card details. Always confirm a
          payment on your server before you deliver anything.
        </p>
      </section>
    </article>
  )
}
