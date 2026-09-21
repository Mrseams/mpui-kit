import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { classSlots } from "@/lib/class-slots"

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

/** The keys declared in `export interface <Name>ClassNames { ... }`. */
function declaredKeys(source: string, component: string): string[] {
  const block = source.match(
    new RegExp(String.raw`export interface ${component}ClassNames \{([\s\S]*?)\n\}`)
  )
  if (!block) throw new Error(`No ${component}ClassNames interface found`)
  return [...block[1].matchAll(/^\s*(\w+)\?:/gm)].map((match) => match[1])
}

describe.each(classSlots)(
  "class slots: $component",
  ({ component, file, slotPrefix, keys, forwarded = [] }) => {
    const source = readFileSync(`registry/mpkit/components/${file}`, "utf8")

    it("lists exactly the keys of its ClassNames interface", () => {
      expect([...declaredKeys(source, component)].sort()).toEqual([...keys].sort())
    })

    it("marks each own part with a data-slot attribute", () => {
      for (const key of keys.filter((item) => !forwarded.includes(item))) {
        const slot = `${slotPrefix}-${kebab(key)}`
        expect(source, `${component}.${key} should render data-slot="${slot}"`).toContain(
          `data-slot="${slot}"`
        )
      }
    })

    it("applies each key from classNames", () => {
      for (const key of keys) {
        expect(source, `${component} should use classNames?.${key}`).toContain(`classNames?.${key}`)
      }
    })
  }
)
