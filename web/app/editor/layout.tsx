import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Email Editor — Build and Export HTML Email",
  description:
    "Open the free Blokma editor: drag blocks onto a 600px canvas, style every block live, and export table-based HTML email that renders in Gmail, Outlook and Apple Mail.",
  alternates: { canonical: "/editor" },
  openGraph: {
    type: "website",
    title: "Blokma Email Editor",
    description:
      "Drag blocks onto a 600px canvas, style every block live, and export Outlook-safe HTML email.",
    url: "/editor",
  },
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-0 flex-1 flex-col">{children}</main>
}
