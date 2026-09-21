import { cm } from "@/lib/mpkit/countries/cm"
import type { CountryConfig } from "@/lib/mpkit/countries/types"

/**
 * Index of every country shipped in this repo. Used by the docs site and the
 * country tests. It is NOT distributed to users: each country is its own
 * registry item, so an app only installs the countries it needs.
 *
 * To add a country, create `registry/countries/<iso>.ts` and add it here.
 */
export const countries = { cm } satisfies Record<string, CountryConfig>

export type CountryCode = keyof typeof countries
