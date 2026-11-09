import Link from "next/link"

import { cn } from "@/lib/utils"
import { APP_NAME, APP_TAGLINE } from "@/core/client"
import { SECTIONS } from "@/core/meta"
import { Logo } from "@/components/ui/logo"

const ROUTES = [{ href: "/editor", label: "Editor" }]

export function Footer({ isAuth }: { isAuth: boolean }) {
  const account = isAuth ? [{ href: "/app", label: "Dashboard" }] : []

  return (
    <footer className="overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-20 sm:px-6 sm:pt-28">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-20">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label={`${APP_NAME} — home`}
              className="inline-flex items-center gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
            >
              <Logo className="size-12 text-foreground" />
              <span className="text-4xl font-bold tracking-[-0.03em]">
                {APP_NAME}
              </span>
            </Link>
            <p className="mt-6 max-w-xs text-sm/6 text-muted-foreground text-pretty">
              {APP_TAGLINE}. Build it in the browser, export HTML that renders anywhere.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-14 gap-y-10 sm:gap-x-24">
            <FooterNav label="Explore" links={SECTIONS} />
            <FooterNav label="Product" links={[...ROUTES, ...account]} />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span suppressHydrationWarning className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <span className="text-xs text-muted-foreground">
            Free · No sign-up · Runs in your browser
          </span>
        </div>
      </div>

      {/* The name, set big enough to run off the bottom edge. */}
      <div
        aria-hidden
        className="mx-auto -mb-[0.2em] max-w-6xl px-4 pt-6 text-center font-display text-[clamp(5rem,24vw,17rem)] leading-[0.8] font-bold tracking-[-0.05em] text-muted-foreground/15 select-none sm:px-6"
      >
        {APP_NAME}
      </div>
    </footer>
  )
}

function FooterNav({
  label,
  links,
}: {
  label: string
  links: { href: string; label: string }[]
}) {
  return (
    <nav aria-label={label}>
      <span className="block text-xs font-semibold tracking-wide text-foreground uppercase">
        {label}
      </span>
      <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
        {links.map(({ href, label: text }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "rounded-sm transition-colors outline-none hover:text-foreground",
                "focus-visible:ring-3 focus-visible:ring-primary/50",
              )}
            >
              {text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
