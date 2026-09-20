import type { Metadata } from "next"

import { ThemeDemo } from "@/app/docs/theming/theme-demo"
import { CodeBlock } from "@/components/site/code-block"
import { classSlots } from "@/lib/class-slots"
import { demoThemes, themeTokens } from "@/lib/demo-themes"

export const metadata: Metadata = { title: "Theming" }

const tokens = `/* app/globals.css: the same tokens the rest of your shadcn app uses */
:root {
  --primary: oklch(0.52 0.15 150);
  --primary-foreground: oklch(0.98 0 0);
  --radius: 1rem;

  /* Optional. The receipt checkmark uses this, or --primary if you leave it out. */
  --success: oklch(0.52 0.15 150);
}`

const classNamesExample = `<MomoCheckout
  amount={25000}
  onPay={onPay}
  className="max-w-md shadow-sm"
  classNames={{
    title: "text-xl",
    total: "border-dashed",
    submit: "uppercase tracking-wide",
    receipt: "bg-muted",
  }}
/>

<PaymentMethodPicker
  classNames={{
    option: "p-4 has-[:checked]:shadow-md",   // the selected card
    optionLabel: "font-semibold",
  }}
/>`

const dataSlotExample = `/* Every part has a data-slot attribute, so you can also style it from CSS. */
[data-slot="momo-checkout-submit"] { letter-spacing: 0.02em; }
[data-slot="ussd-prompt-code"] { font-size: 2rem; }
[data-slot="operator-badge"] { border-color: currentColor; }`

export default function ThemingPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Theming</h1>
        <p className="text-muted-foreground max-w-prose">
          The components are built from the same tokens as the rest of a shadcn/ui app, so they
          follow your theme, your radius and your dark mode without extra work. When you need more,
          there are two more levels.
        </p>
      </header>

      <section aria-labelledby="requirements" className="space-y-3">
        <h2 id="requirements" className="text-xl font-semibold">
          Requirements
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          <li>
            <strong>Tailwind CSS v4.</strong> The styling is Tailwind classes. An app that does not
            use Tailwind gets no styling from these components.
          </li>
          <li>
            <strong>shadcn/ui set up with CSS variables</strong> (<code>shadcn init</code> does
            this), so <code>bg-card</code>, <code>text-muted-foreground</code> and the other tokens
            exist.
          </li>
          <li>
            <strong>React 19.</strong> Several components take <code>ref</code> as a normal prop.
          </li>
        </ul>
      </section>

      <section aria-labelledby="preview" className="space-y-3">
        <h2 id="preview" className="text-xl font-semibold">
          Try it
        </h2>
        <p className="text-muted-foreground max-w-prose">
          The same checkout in four themes. Each theme is only a few CSS variables set on a wrapper.
          Nothing in the component changes. Walk through the flow in each one, including a failure
          or a timeout.
        </p>
        <div className="rounded-lg border p-4 sm:p-6">
          <ThemeDemo />
        </div>
        <CodeBlock label="Theme variables" code={tokens} />
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          {demoThemes.map((theme) => (
            <li key={theme.id}>
              <strong>{theme.label}:</strong> {theme.description}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tokens" className="space-y-3">
        <h2 id="tokens" className="text-xl font-semibold">
          1. The tokens the components read
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="sr-only">Theme tokens</caption>
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Token
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Where it shows up
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {themeTokens.map((row) => (
                <tr key={row.token} className="align-top">
                  <th scope="row" className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                    {row.token}
                  </th>
                  <td className="text-muted-foreground px-3 py-2">{row.usedFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground max-w-prose text-sm">
          The buttons and inputs are your own shadcn <code>Button</code> and <code>Input</code>, so
          they carry your variants. The operator dots are the exception: their colors come from the
          country data, and you can replace them with your own logos.
        </p>
      </section>

      <section aria-labelledby="classnames" className="space-y-3">
        <h2 id="classnames" className="text-xl font-semibold">
          2. className and classNames
        </h2>
        <p className="text-muted-foreground max-w-prose">
          <code>className</code> styles the root of a component. The larger ones also take{" "}
          <code>classNames</code> for their inner parts, and every part has a <code>data-slot</code>{" "}
          attribute. Classes are merged with the built-in ones, so yours win when they conflict.
        </p>
        <CodeBlock label="classNames example" code={classNamesExample} />
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="sr-only">Slots by component</caption>
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Component
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  classNames keys
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {classSlots.map((row) => (
                <tr key={row.component} className="align-top">
                  <th scope="row" className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                    {row.component}
                  </th>
                  <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                    {row.keys.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock label="Styling with data-slot from CSS" code={dataSlotExample} />
      </section>

      <section aria-labelledby="source" className="space-y-3">
        <h2 id="source" className="text-xl font-semibold">
          3. Edit the source
        </h2>
        <p className="text-muted-foreground max-w-prose">
          Like the rest of shadcn/ui, the components are copied into your project, so anything the
          two levels above do not cover you can change directly. Text sizes and spacing are plain
          Tailwind classes in the files under <code>components/mboa/</code>.
        </p>
      </section>
    </article>
  )
}
