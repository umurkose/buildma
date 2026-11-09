"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { PANEL, PANEL_GUTTER, Reveal, RevealGroup } from "@/components/landing/section"

export function FinalCta() {
  return (
    <section className={cn("w-full min-w-0", PANEL_GUTTER)}>
      <div
        className={cn(
          PANEL,
          "relative isolate overflow-hidden bg-primary px-4 py-20 text-primary-foreground sm:px-6 sm:py-28",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(color-mix(in_oklab,var(--color-primary-foreground)_22%,transparent)_1px,transparent_1px)] bg-size-[22px_22px]"
        />

        <RevealGroup className="relative mx-auto max-w-5xl">
          <Reveal>
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <h2 className="text-5xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
                Your next email is a few blocks away
              </h2>
              <p className="mt-6 max-w-xl text-lg text-primary-foreground/80 text-pretty">
                Open a blank canvas and export the HTML when it looks right. Nothing to
                install, nothing to sign up for.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/editor"
                  className="group brick inline-flex h-13 items-center gap-2 rounded-full bg-background pr-5 pl-6 text-base font-semibold text-foreground transition-[background-color,scale] duration-200 ease-out outline-none hover:bg-background/90 focus-visible:ring-3 focus-visible:ring-primary-foreground/50 active:scale-[0.98]"
                >
                  Start building — it&apos;s free
                  <ArrowRight className="size-4.5 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#blocks"
                  className="inline-flex h-13 items-center rounded-full border border-primary-foreground/40 px-6 text-base font-semibold transition-colors outline-none hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-primary-foreground/50"
                >
                  Blocks
                </Link>
              </div>
              <p className="mt-8 text-sm text-primary-foreground/70">
                No account · No credit card · Your draft stays in your browser
              </p>
            </div>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  )
}
