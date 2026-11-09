"use client"

import { useEffect, useState, type RefObject } from "react"
import Link from "next/link"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useTheme } from "next-themes"
import { ArrowRight, Moon, Sun } from "lucide-react"

import { APP_NAME, SECTIONS } from "@/core/meta"
import { Button } from "@/components/ui/button"
import { BlockLogo } from "@/components/landing/logo"

const ENTRANCE = { type: "spring", bounce: 0, duration: 0.5 } as const

export function Navbar({
  scrollRef,
  isAuth,
}: {
  scrollRef: RefObject<HTMLDivElement | null>
  isAuth: boolean
}) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll({ container: scrollRef })
  // The bar sits on the page at the top and gains its own surface once content
  // starts passing underneath. Driven off a motion value, so scrolling never
  // re-renders the navbar.
  const chrome = useTransform(scrollY, [0, 48], [0, 1])

  return (
    // The bar uses the page's content box, so the logo and the Editor button sit
    // exactly on the same edges as every section below. Only its pill surface
    // reaches a little past them, into the gutter.
    <header className="sticky top-0 z-50 mx-auto max-w-6xl px-4 pt-3 sm:px-6">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ENTRANCE}
        className="relative flex h-14 items-center justify-between gap-3"
      >
        <motion.div
          aria-hidden
          style={{ opacity: chrome }}
          className="pointer-events-none absolute -inset-x-2.5 inset-y-0 -z-10 rounded-full border border-border bg-background/80 shadow-[0_12px_32px_-16px_oklch(0_0_0/0.3)] backdrop-blur-xl sm:-inset-x-3.5"
        />

        <Link
          href="/"
          aria-label={`${APP_NAME} — home`}
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-primary/50"
        >
          <BlockLogo />
          <span className="font-display text-xl font-extrabold tracking-[-0.03em]">{APP_NAME}</span>
        </Link>

        <nav
          aria-label="Sections"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
        >
          {SECTIONS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-primary/50"
            >
              {label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Account" className="flex items-center gap-1.5">
          <ThemeToggle />
          {isAuth && (
            <Button asChild size="sm" variant="outline" className="hidden h-9 px-3.5 sm:inline-flex">
              <Link href="/app">Dashboard</Link>
            </Button>
          )}
          <Link
            href="/editor"
            className="group brick inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-200 ease-out outline-none focus-visible:ring-3 focus-visible:ring-primary/50 active:scale-[0.97] motion-safe:hover:-translate-y-px"
          >
            Editor
            <ArrowRight className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </motion.div>
    </header>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  const dark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-10"
      aria-label={mounted && dark ? "Light" : "Dark"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {mounted && dark ? <Sun /> : <Moon />}
    </Button>
  )
}
