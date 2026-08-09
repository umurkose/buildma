import type { MetadataRoute } from "next"

import { absolute } from "@/core/meta"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absolute("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absolute("/editor"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
