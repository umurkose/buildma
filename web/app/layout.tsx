import type { Metadata, Viewport } from "next"
import { GoogleAnalytics } from "@next/third-parties/google"
import "./globals.css"
import { APP_NAME } from "@/core/server"
import { SITE, socialMetadata } from "@/core/meta"
import { ThemeProvider } from "@/components/theme/provider"
import { QueryProvider } from "@/components/layout/query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AlertDialogHost } from "@/components/ui/alert-dialog"
import { Toaster } from "@/components/ui/sonner"
import { AccessibilityDock } from "@/components/layout/accessibility"
import { VisitBeacon } from "@/components/analytics/beacon"
import { textSizeScript } from "@/components/theme/text-size"
import { navShellScript } from "@/components/layout/shell"
import { primaryColorScript } from "@/components/theme/color"

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s | ${APP_NAME}` },
  description: SITE.description,
  applicationName: APP_NAME,
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  keywords: [...SITE.keywords],
  authors: [{ name: APP_NAME, url: SITE.url }],
  creator: APP_NAME,
  publisher: APP_NAME,
  category: "technology",
  alternates: { canonical: "/" },
  verification: { google: "lEqLzS-thyy37vR0ODXMFBTc4c6uZQUmuuLiQvBbVm4" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: { email: false, address: false, telephone: false },
  ...socialMetadata(),
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
}

function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <InlineScript html={textSizeScript} />
        <InlineScript html={navShellScript} />
        <InlineScript html={primaryColorScript} />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider delayDuration={0}>
              {children}
              <AlertDialogHost />
              <Toaster />
              <AccessibilityDock />
              <VisitBeacon />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-EGVGDFYQZ8" />
      </body>
    </html>
  )
}
