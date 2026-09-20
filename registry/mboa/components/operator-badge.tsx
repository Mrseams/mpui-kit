import type { ComponentProps, ReactNode } from "react"

import type { OperatorConfig } from "@/lib/mboa/countries/types"
import { cn } from "@/lib/utils"

export interface OperatorBadgeProps extends ComponentProps<"span"> {
  operator: OperatorConfig
  /**
   * Your own logo, shown instead of the color dot. mboa-ui ships no operator
   * logos or brand assets; bring your own if you have the right to use them.
   */
  logo?: ReactNode
}

/** A neutral badge for a mobile operator: a color dot (or your logo) and the name. */
export function OperatorBadge({ operator, logo, className, ...props }: OperatorBadgeProps) {
  return (
    <span
      data-slot="operator-badge"
      className={cn(
        "bg-background inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
      {...props}
    >
      {logo ?? (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: operator.color }}
        />
      )}
      {operator.name}
    </span>
  )
}
