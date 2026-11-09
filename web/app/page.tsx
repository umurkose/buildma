import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { getToken } from "@/core/server"
import { SITE, homeJsonLd, socialMetadata } from "@/core/meta"
import { Landing } from "@/components/landing/landing"

// The landing's typeface, self-hosted by next/font and scoped to this page: the
// dashboard and editor stay on the system font and never download it. The
// optical-size axis gives the big headlines Inter's tighter display cut.
const display = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  axes: ["opsz"],
})

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
      <Landing isAuth={isAuth} className={display.variable} />
    </>
  )
}
