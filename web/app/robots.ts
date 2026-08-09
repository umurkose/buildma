import type { MetadataRoute } from "next"

import { absolute } from "@/core/meta"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app", "/app/", "/auth/"],
    },
    sitemap: absolute("/sitemap.xml"),
  }
}
