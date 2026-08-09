"use client"

import { useEffect, useState, type RefObject } from "react"
import Link from "next/link"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

import { SECTIONS } from "@/core/meta"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/ui/logo"

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
  const maxWidth = useTransform(scrollY, [0, 96], [680, 1024])
  const chrome = useTransform(scrollY, [0, 96], [0, 1])
  const nav = useTransform(scrollY, [56, 104], [0, 1])
  const navPointer = useTransform(nav, (value) => (value < 0.5 ? "none" : "auto"))
  // visibility, not just pointer-events. An element at opacity 0 is still in the tab
  // order and still in the accessibility tree, so at the top of the page a keyboard
  // user tabbed into four invisible section links and a screen reader announced them.
  // `visibility: hidden` removes it from both. Driven off the same motion value, so
  // it flips on exactly the threshold the fade does — and off a motion value rather
  // than React state, so scrolling never re-renders the navbar.
  const navVisibility = useTransform(nav, (value) => (value < 0.5 ? "hidden" : "visible"))

  const hidden = reduce ? { opacity: 0 } : { opacity: 0, y: -6 }
  const shown = reduce ? { opacity: 1 } : { opacity: 1, y: 0 }
  const item = { hidden, show: { ...shown, transition: ENTRANCE } }
  const navStagger = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0.1 } },
  }

  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <motion.div
        style={{ maxWidth }}
        className="relative mx-auto flex h-11 items-center justify-between rounded-full pr-1.5 pl-4"
      >
        <motion.div
          aria-hidden
          style={{ opacity: chrome }}
          className="pointer-events-none absolute inset-0 -z-10 rounded-full border border-border bg-background/70 backdrop-blur-xl"
        />

        <motion.div initial={hidden} animate={shown} transition={{ ...ENTRANCE, delay: 0.05 }}>
          <Link href="/" aria-label="Blokma — home">
            <Wordmark />
          </Link>
        </motion.div>

        <motion.nav
          aria-label="Sections"
          style={{ opacity: nav, pointerEvents: navPointer, visibility: navVisibility }}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
        >
          {SECTIONS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </motion.nav>

        <motion.nav
          aria-label="Account"
          variants={navStagger}
          initial="hidden"
          animate="show"
          className="flex items-center gap-1.5"
        >
          <motion.div variants={item}>
            <ThemeToggle />
          </motion.div>
          {isAuth && (
            <>
              <motion.div variants={item} className="mx-1 h-5 w-px shrink-0 self-center bg-border" />
              <motion.div variants={item}>
                <Button asChild size="sm">
                  <Link href="/app">Dashboard</Link>
                </Button>
              </motion.div>
            </>
          )}
        </motion.nav>
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
      size="icon-sm"
      aria-label={mounted && dark ? "Light" : "Dark"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {mounted && dark ? <Sun /> : <Moon />}
    </Button>
  )
}
