import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The library source lives in packages/, outside this app. Compile from the
  // repository root so Turbopack follows the tsconfig paths into it.
  turbopack: { root: fileURLToPath(new URL("../..", import.meta.url)) },
  async redirects() {
    // The page was renamed. Temporary (307) so the old path stays free to reuse.
    return [{ source: "/playground", destination: "/showcase", permanent: false }]
  },
}

export default nextConfig
