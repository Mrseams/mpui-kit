import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    // The page was renamed. Temporary (307) so the old path stays free to reuse.
    return [{ source: "/playground", destination: "/showcase", permanent: false }]
  },
}

export default nextConfig
