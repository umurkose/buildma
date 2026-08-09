"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Reveal, RevealGroup } from "@/components/landing/section"

const DRIFT_A = { duration: 26, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } as const
const DRIFT_B = { duration: 34, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } as const

export function FinalCta() {
  const reduce = useReducedMotion()

  return (
    <section className="relative flex w-full min-w-0 flex-col justify-center overflow-hidden bg-primary py-24 text-primary-foreground lg:min-h-svh">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_oklab,var(--color-primary-foreground)_22%,transparent)_1px,transparent_1px)] bg-size-[22px_22px]"
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-24 size-[38rem] rounded-full bg-[radial-gradient(circle,#fff,transparent_65%)] opacity-[0.1] blur-3xl"
        animate={reduce ? undefined : { x: [0, 120, 0], y: [0, 60, 0] }}
        transition={reduce ? undefined : DRIFT_A}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 -bottom-48 size-[44rem] rounded-full bg-[radial-gradient(circle,#fff,transparent_65%)] opacity-[0.08] blur-3xl"
        animate={reduce ? undefined : { x: [0, -110, 0], y: [0, -70, 0] }}
        transition={reduce ? undefined : DRIFT_B}
      />

      <div className="relative mx-auto w-full max-w-5xl px-5">
        <RevealGroup>
          <Reveal>
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="text-4xl leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-5xl lg:text-6xl">
              Your next email is a few blocks away
            </h2>
            <p className="mt-6 text-lg text-primary-foreground/80 text-pretty">
              Open a blank canvas and export the HTML when it looks right. Nothing to
              install, nothing to sign up for.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/editor" className="group">
                  Start building — it&apos;s free
                  <ArrowRight
                    data-icon="inline-end"
                    className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/35 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="#blocks">Blocks</Link>
              </Button>
            </div>
            <p className="mt-8 text-xs text-primary-foreground/70">
              No account · No credit card · Your draft stays in your browser
            </p>
          </div>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  )
}
