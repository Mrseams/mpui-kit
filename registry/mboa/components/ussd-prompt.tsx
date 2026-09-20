"use client"

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
  /** The three waiting dots. */
  dots?: string
  title?: string
  /** The reminder of which number the request went to. */
  phone?: string
  /** The USSD code. */
  code?: string
  /** The waiting or timeout message. */
  status?: string
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
 * code with copy and dial actions, an animated waiting state, a countdown and
 * a retry button once the request times out.
 *
 * It only shows state. Starting the payment, checking its status and deciding
 * the outcome is up to you (see the checkout block).
 */
export function UssdPrompt({
  code,
  expiresAt,
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

  const href = code ? dialHref(code) : undefined
  const bucket = announcementBucket(remaining)
  const announcement =
    !expired && expiresAt !== undefined && bucket > 0
      ? t("ussd.almostExpired", { time: formatCountdown(bucket * 1000) })
      : ""

  return (
    <section
      ref={rootRef}
      data-slot="ussd-prompt"
      data-state={expired ? "expired" : "waiting"}
      aria-labelledby={titleId}
      className={cn("bg-card space-y-4 rounded-lg border p-4", className)}
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
      <div className="flex items-start gap-3">
        <WaitingDots active={!expired} className={classNames?.dots} />
        <div className="min-w-0 space-y-1">
          <h3
            id={titleId}
            data-slot="ussd-prompt-title"
            className={cn("leading-tight font-medium", classNames?.title)}
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
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">{t("ussd.instructions")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0">
              <p id={codeLabelId} className="text-muted-foreground text-xs">
                {t("ussd.codeLabel")}
              </p>
              <code
                aria-labelledby={codeLabelId}
                data-slot="ussd-prompt-code"
                className={cn(
                  "block font-mono text-2xl font-semibold tracking-wide select-all",
                  classNames?.code
                )}
              >
                {code}
              </code>
            </div>
            <CopyCodeButton code={code} t={t} />
            {href && (
              <a href={href} className={buttonVariants({ variant: "default" })}>
                {t("ussd.dial")}
              </a>
            )}
          </div>
        </div>
      )}

      <p
        role="status"
        data-slot="ussd-prompt-status"
        className={cn("text-sm font-medium", classNames?.status)}
      >
        {expired ? t("ussd.timeout") : t("ussd.waiting")}
      </p>

      {!expired && expiresAt !== undefined && (
        <>
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

      {expired && onRetry && (
        <Button
          ref={retryRef}
          type="button"
          data-slot="ussd-prompt-retry"
          className={classNames?.retry}
          onClick={onRetry}
        >
          {t("ussd.retry")}
        </Button>
      )}
    </section>
  )
}

/** Three dots that pulse while waiting. The pulse is skipped for users who prefer reduced motion. */
function WaitingDots({ active, className }: { active: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="ussd-prompt-dots"
      className={cn("mt-2 flex shrink-0 gap-1", className)}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            "size-2 rounded-full",
            active ? "bg-primary motion-safe:animate-pulse" : "bg-muted-foreground/40"
          )}
          style={active ? { animationDelay: `${index * 200}ms` } : undefined}
        />
      ))}
    </span>
  )
}

function CopyCodeButton({ code, t }: { code: string; t: Translator }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    setState((await copyToClipboard(code)) ? "copied" : "failed")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), 2000)
  }

  const label =
    state === "copied"
      ? t("ussd.copied")
      : state === "failed"
        ? t("ussd.copyFailed")
        : t("ussd.copy")

  return (
    <>
      <Button type="button" variant="outline" onClick={copy}>
        {label}
      </Button>
      <span className="sr-only" aria-live="polite">
        {state === "idle" ? "" : label}
      </span>
    </>
  )
}

function displayPhone(phone: string, country?: CountryConfig): string {
  if (!country) return phone
  const result = validatePhone(phone, country)
  return result.valid ? formatInternational(result.national, country) : phone
}
