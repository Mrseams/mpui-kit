"use client"

import { Smartphone } from "lucide-react"
import { useEffect, useId, useRef, useState, type ComponentProps } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { useLocale, useMboa, useT } from "@/components/mboa/mboa-provider"
import { useCountdown } from "@/hooks/mboa/use-countdown"
import { copyToClipboard } from "@/lib/mboa/clipboard"
import { announcementBucket, formatCountdown } from "@/lib/mboa/countdown"
import type { CountryConfig, Locale } from "@/lib/mboa/countries/types"
import { dialHref } from "@/lib/mboa/dial"
import type { Translator } from "@/lib/mboa/i18n"
import { formatInternational, validatePhone } from "@/lib/mboa/phone"
import { cn } from "@/lib/utils"

/** Parts of the prompt you can style. Each also has a `data-slot` attribute. */
export interface UssdPromptClassNames {
  /** The phone icon with the ripple that shows the prompt is waiting. */
  indicator?: string
  title?: string
  /** The reminder of which number the request went to. */
  phone?: string
  /** The box that holds the USSD code. */
  codeBox?: string
  /** The USSD code. */
  code?: string
  /** The waiting or timeout message. */
  status?: string
  /** The bar that shrinks as time runs out. */
  bar?: string
  /** The visible countdown. */
  countdown?: string
  /** The "Try again" button. */
  retry?: string
}

export interface UssdPromptProps extends Omit<ComponentProps<"section">, "children"> {
  /**
   * The USSD code to dial if the prompt does not reach the phone, such as
   * "*126#". Leave it out when the operator pushes the prompt without a code.
   */
  code?: string
  /** When the request times out, as a Unix time in milliseconds. */
  expiresAt?: number
  /**
   * The total time allowed, in milliseconds. Shows a bar that shrinks as time
   * runs out. Without it there is only the countdown text.
   */
  durationMs?: number
  /** The number the request was sent to. Shown as a reminder. */
  phone?: string
  /** Called when the user asks to try again after the request timed out. */
  onRetry?: () => void
  /** Called once when the countdown reaches zero. */
  onExpire?: () => void
  /** Only used to format `phone`. Defaults to the one in `MboaProvider`. */
  country?: CountryConfig
  locale?: Locale
  /** Class names for parts of the prompt. `className` styles the root. */
  classNames?: UssdPromptClassNames
}

/**
 * Asks the user to approve a Mobile Money payment on their phone: shows the
 * code with copy and dial actions, a waiting animation, a countdown and a
 * retry button once the request times out.
 *
 * It only shows state. Starting the payment, checking its status and deciding
 * the outcome is up to you (see the checkout block).
 */
export function UssdPrompt({
  code,
  expiresAt,
  durationMs,
  phone,
  onRetry,
  onExpire,
  country: countryProp,
  locale: localeProp,
  classNames,
  className,
  onFocus,
  onBlur,
  ...props
}: UssdPromptProps) {
  const locale = useLocale(localeProp)
  const t = useT(locale)
  const context = useMboa()
  const country = countryProp ?? context.country

  const titleId = useId()
  const codeLabelId = useId()
  const rootRef = useRef<HTMLElement>(null)
  const retryRef = useRef<HTMLButtonElement>(null)

  const remaining = useCountdown(expiresAt ?? null, { onExpire })
  const expired = expiresAt !== undefined && remaining === 0

  // When the request expires the copy button disappears. If keyboard focus was
  // on it, hand focus to the retry button instead of dropping it on <body>.
  // Focus is tracked with events because by the time an effect runs, React has
  // already removed the focused element and document.activeElement is <body>.
  const focusInside = useRef(false)
  const wasExpired = useRef(expired)
  useEffect(() => {
    if (expired && !wasExpired.current && focusInside.current) retryRef.current?.focus()
    wasExpired.current = expired
  }, [expired])

  const copy = useCopyCode(code)
  const href = code ? dialHref(code) : undefined
  const bucket = announcementBucket(remaining)
  const announcement =
    !expired && expiresAt !== undefined && bucket > 0
      ? t("ussd.almostExpired", { time: formatCountdown(bucket * 1000) })
      : ""
  const fractionLeft = durationMs ? Math.min(1, Math.max(0, remaining / durationMs)) : null

  return (
    <section
      ref={rootRef}
      data-slot="ussd-prompt"
      data-state={expired ? "expired" : "waiting"}
      aria-labelledby={titleId}
      className={cn(
        "bg-card space-y-5 rounded-lg border p-5 text-center",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300",
        className
      )}
      {...props}
      onFocus={(event) => {
        focusInside.current = true
        onFocus?.(event)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) focusInside.current = false
        onBlur?.(event)
      }}
    >
      <div className="space-y-3">
        <Indicator active={!expired} className={classNames?.indicator} />
        <div className="space-y-1">
          <h3
            id={titleId}
            data-slot="ussd-prompt-title"
            className={cn("leading-tight font-medium text-balance", classNames?.title)}
          >
            {t("ussd.title")}
          </h3>
          {phone && (
            <p
              data-slot="ussd-prompt-phone"
              className={cn("text-muted-foreground text-sm", classNames?.phone)}
            >
              {t("ussd.sentTo", { phone: displayPhone(phone, country) })}
            </p>
          )}
        </div>
      </div>

      {!expired && code && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm text-pretty">{t("ussd.instructions")}</p>
          <div
            data-slot="ussd-prompt-code-box"
            className={cn("bg-muted/50 rounded-lg border px-4 py-3", classNames?.codeBox)}
          >
            <p id={codeLabelId} className="text-muted-foreground text-xs">
              {t("ussd.codeLabel")}
            </p>
            <code
              aria-labelledby={codeLabelId}
              data-slot="ussd-prompt-code"
              className={cn(
                "block font-mono text-3xl font-semibold tracking-widest select-all",
                classNames?.code
              )}
            >
              {code}
            </code>
          </div>
          {/* Two equal buttons. A single one takes the whole row. */}
          <div className="*:only-child:col-span-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-10 w-full py-2 leading-tight whitespace-normal"
              onClick={copy.copy}
            >
              {copy.label(t)}
            </Button>
            {href && (
              <a
                href={href}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-auto min-h-10 w-full py-2 leading-tight whitespace-normal"
                )}
              >
                {t("ussd.dial")}
              </a>
            )}
          </div>
          <span className="sr-only" aria-live="polite">
            {copy.state === "idle" ? "" : copy.label(t)}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <p
          role="status"
          data-slot="ussd-prompt-status"
          className={cn("text-sm font-medium", classNames?.status)}
        >
          {expired ? t("ussd.timeout") : t("ussd.waiting")}
        </p>

        {!expired && expiresAt !== undefined && (
          <>
            {fractionLeft !== null && (
              <div
                aria-hidden="true"
                data-slot="ussd-prompt-bar"
                className={cn("bg-muted h-1.5 overflow-hidden rounded-full", classNames?.bar)}
              >
                {/* Shrinks smoothly, one second at a time. Static for reduced motion. */}
                <div
                  className="bg-primary h-full origin-left rounded-full transition-transform duration-1000 ease-linear motion-reduce:transition-none"
                  style={{ transform: `scaleX(${fractionLeft})` }}
                />
              </div>
            )}
            {/* Read out only at milestones (see the live region below), not every second. */}
            <p
              aria-hidden="true"
              data-slot="ussd-prompt-countdown"
              className={cn("text-muted-foreground text-sm tabular-nums", classNames?.countdown)}
            >
              <span suppressHydrationWarning>
                {t("ussd.expiresIn", { time: formatCountdown(remaining) })}
              </span>
            </p>
            <span className="sr-only" aria-live="polite">
              {announcement}
            </span>
          </>
        )}
      </div>

      {expired && onRetry && (
        <Button
          ref={retryRef}
          type="button"
          data-slot="ussd-prompt-retry"
          className={cn(
            "h-auto min-h-10 w-full py-2 leading-tight whitespace-normal",
            classNames?.retry
          )}
          onClick={onRetry}
        >
          {t("ussd.retry")}
        </Button>
      )}
    </section>
  )
}

/**
 * A phone icon. While waiting, a ring ripples out from it. The ripple is skipped
 * for users who prefer reduced motion, and the icon stays.
 */
function Indicator({ active, className }: { active: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="ussd-prompt-indicator"
      className={cn("relative mx-auto flex size-14 items-center justify-center", className)}
    >
      {active && (
        <span className="bg-primary/20 absolute inset-0 rounded-full motion-safe:animate-ping" />
      )}
      <span
        className={cn(
          "relative flex size-14 items-center justify-center rounded-full transition-colors",
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Smartphone className="size-6" />
      </span>
    </span>
  )
}

/** Copy-to-clipboard state for the code, with a label that confirms or reports failure. */
function useCopyCode(code: string | undefined) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    if (!code) return
    setState((await copyToClipboard(code)) ? "copied" : "failed")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), 2000)
  }

  const label = (t: Translator) =>
    state === "copied"
      ? t("ussd.copied")
      : state === "failed"
        ? t("ussd.copyFailed")
        : t("ussd.copy")

  return { state, copy, label }
}

/** The number in international format, with no-break spaces so it never splits across lines. */
function displayPhone(phone: string, country?: CountryConfig): string {
  if (!country) return phone
  const result = validatePhone(phone, country)
  const text = result.valid ? formatInternational(result.national, country) : phone
  return text.replaceAll(" ", " ")
}
