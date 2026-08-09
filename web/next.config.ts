import type { NextConfig } from "next"

// --- Headers ---

const isProd = process.env.NODE_ENV === "production"

const SECURITY = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests",
  },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
]

// noindex as a HEADER, not a meta tag, because these routes cannot carry one.
const NO_INDEX = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.15"],

  async headers() {
    return [
      { source: "/:path*", headers: SECURITY },
      { source: "/app/:path*", headers: [NO_INDEX] },
      { source: "/api/:path*", headers: [NO_INDEX] },
      { source: "/auth/:path*", headers: [NO_INDEX] },
    ]
  },
}

export default nextConfig
