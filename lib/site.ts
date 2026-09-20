/**
 * Public URL of the deployed docs site. It is also where the registry is served
 * (`/r/<name>.json`). Set NEXT_PUBLIC_SITE_URL on Vercel once the domain is known.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mboa-ui.vercel.app").replace(
  /\/$/,
  ""
)

/** Registry URL template for the `@mboa` namespace. */
export const registryUrlTemplate = `${siteUrl}/r/{name}.json`
