import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * The MPUI-KIT mark: "*#", the two keys every USSD code is built from. The
 * tile takes the text color and the glyphs the background, so it inverts with
 * the theme. Keep the paths in sync with public/logo.svg.
 */
export function LogoMark({ className, ...props }: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-7", className)} {...props}>
      <rect width="64" height="64" rx="14" className="fill-foreground" />
      <g fill="none" strokeWidth="5.5" strokeLinecap="round" className="stroke-background">
        <path d="M19 22v16M12.07 26l13.86 8M12.07 34l13.86-8" />
        <path d="M40 18l-3.5 28M49.5 18L46 46M32.5 26.5h21M31 37.5h21" />
      </g>
    </svg>
  )
}
