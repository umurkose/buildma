import type { MetadataRoute } from "next"

import { absolute } from "@/core/meta"

const LAST_MODIFIED = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absolute("/"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absolute("/editor"),
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
