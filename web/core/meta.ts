import type { Metadata } from "next"

import { BLOCKS, CAPABILITIES, FAQ, STEPS } from "@/components/landing/content"

export const APP_NAME = "Blockma"

export const APP_TAGLINE = "The free drag-and-drop email builder"

const RAW_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
export const SITE_URL = RAW_URL.replace(/\/+$/, "")

export const SITE = {
  name: APP_NAME,
  tagline: APP_TAGLINE,
  url: SITE_URL,
  title: `${APP_NAME} — Free Drag & Drop Email Template Builder`,
  description:
    "Build responsive HTML emails without code. Drag blocks onto a 600px canvas, style everything live, and export Outlook-safe email HTML. Free, no sign-up.",
  keywords: [
    "email builder",
    "email template builder",
    "drag and drop email editor",
    "HTML email builder",
    "free email template generator",
    "responsive email templates",
    "newsletter builder",
    "transactional email templates",
    "Outlook safe HTML email",
    "email HTML export",
    "no-code email design",
    "MJML alternative",
  ],
  locale: "en_US",
} as const

export const absolute = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`

export const SECTIONS: { href: string; label: string }[] = [
  { href: "#blocks", label: "Blocks" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#export", label: "Export" },
  { href: "#faq", label: "FAQ" },
]

export function socialMetadata(overrides?: {
  title?: string
  description?: string
  path?: string
}): Pick<Metadata, "openGraph" | "twitter"> {
  const title = overrides?.title ?? SITE.title
  const description = overrides?.description ?? SITE.description
  const url = absolute(overrides?.path ?? "/")
  return {
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title,
      description,
      url,
      locale: SITE.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

// --- Structured data --------------------------------------------------------

export function homeJsonLd() {
  const org = absolute("/#organization")
  const site = absolute("/#website")
  const app = absolute("/#app")
  const page = absolute("/#webpage")

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: SITE.name,
        url: absolute("/"),
        description: SITE.description,
        logo: {
          "@type": "ImageObject",
          "@id": absolute("/#logo"),
          url: absolute("/logo.svg"),
          contentUrl: absolute("/logo.svg"),
          caption: SITE.name,
        },
      },
      {
        "@type": "WebSite",
        "@id": site,
        url: absolute("/"),
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": org },
        inLanguage: "en",
      },
      {
        "@type": "WebPage",
        "@id": page,
        url: absolute("/"),
        name: SITE.title,
        description: SITE.description,
        isPartOf: { "@id": site },
        about: { "@id": app },
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": app,
        name: SITE.name,
        url: absolute("/editor"),
        description:
          "A visual drag-and-drop builder for HTML email. Compose an email from blocks on a 600px canvas, style each block live, and export table-based, inline-styled HTML that renders in Gmail, Outlook and Apple Mail.",
        applicationCategory: "DesignApplication",
        applicationSubCategory: "Email Template Builder",
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript. Requires a modern browser.",
        isAccessibleForFree: true,
        publisher: { "@id": org },
        inLanguage: "en",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        featureList: [
          ...CAPABILITIES.map((capability) => `${capability.title} — ${capability.body}`),
          `${BLOCKS.length} block types: ${BLOCKS.map((block) => block.label).join(", ")}`,
        ],
      },
      {
        "@type": "HowTo",
        "@id": absolute("/#howto"),
        name: "How to build an HTML email with Blockma",
        description:
          "Compose an email from blocks, style each one in the inspector, and export HTML that renders the same in every inbox.",
        totalTime: "PT5M",
        estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
        tool: { "@id": app },
        step: STEPS.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.title,
          text: step.body,
          url: absolute(`/#how-it-works`),
        })),
      },
      {
        "@type": "FAQPage",
        "@id": absolute("/#faq"),
        isPartOf: { "@id": page },
        mainEntity: FAQ.map((entry) => ({
          "@type": "Question",
          name: entry.q,
          acceptedAnswer: { "@type": "Answer", text: entry.a },
        })),
      },
    ],
  }
}
