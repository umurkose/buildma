import type { Metadata } from "next"

import { getToken } from "@/core/server"
import { SITE, homeJsonLd, socialMetadata } from "@/core/meta"
import { Landing } from "@/components/landing/landing"

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  description: SITE.description,
  alternates: { canonical: "/" },
  ...socialMetadata(),
}

export default async function HomePage() {
  const isAuth = !!(await getToken())

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()) }}
      />
      <Landing isAuth={isAuth} />
    </>
  )
}
