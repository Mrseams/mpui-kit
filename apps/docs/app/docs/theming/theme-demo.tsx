"use client"

import { useState, type CSSProperties } from "react"

import { CheckoutDemo } from "@/app/docs/components/momo-checkout/checkout-demo"
import { demoThemes } from "@/lib/demo-themes"
import { cn } from "@/lib/utils"

/** The checkout inside a wrapper whose CSS variables you can switch, to see it follow the theme. */
export function ThemeDemo() {
  const [themeId, setThemeId] = useState(demoThemes[0].id)
  const theme = demoThemes.find((item) => item.id === themeId) ?? demoThemes[0]

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Theme</legend>
        <div className="flex flex-wrap gap-2">
          {demoThemes.map((item) => (
            <label
              key={item.id}
              className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-ring/50 cursor-pointer rounded-lg border px-3 py-1.5 text-sm has-[:focus-visible]:ring-3"
            >
              <input
                type="radio"
                name="theme-demo-theme"
                value={item.id}
                checked={themeId === item.id}
                onChange={() => setThemeId(item.id)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">{theme.description}</p>
      </fieldset>

      <div
        data-testid="theme-wrapper"
        className={cn(
          "bg-background text-foreground rounded-lg border p-4 sm:p-6",
          theme.className
        )}
        style={theme.variables as CSSProperties}
      >
        <CheckoutDemo />
      </div>
    </div>
  )
}
