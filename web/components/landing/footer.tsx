import Link from "next/link"

import { APP_NAME, APP_TAGLINE } from "@/core/client"
import { SECTIONS } from "@/core/meta"
import { Logo } from "@/components/ui/logo"

const ROUTES = [{ href: "/editor", label: "Editor" }]

export function Footer({ isAuth }: { isAuth: boolean }) {
  const account = isAuth ? [{ href: "/app", label: "Dashboard" }] : []

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-5xl px-5 py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-20">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label={`${APP_NAME} — home`}
              className="inline-flex items-center gap-4"
            >
              <Logo className="size-14 text-foreground" />
              <span className="text-3xl font-semibold tracking-tight">{APP_NAME}</span>
            </Link>
            <p className="mt-6 max-w-xs text-sm/6 text-muted-foreground text-pretty">
              {APP_TAGLINE}. Build it in the browser, export HTML that renders anywhere.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-10 sm:gap-x-20">
            <FooterNav label="Explore" links={SECTIONS} />
            <FooterNav label="Product" links={[...ROUTES, ...account]} />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span suppressHydrationWarning className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <span className="text-xs text-muted-foreground">
            Free · No sign-up · Runs in your browser
          </span>
        </div>
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
            <Link href={href} className="transition-colors hover:text-foreground">
              {text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
