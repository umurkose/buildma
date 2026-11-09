"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"
import { ScrollContainerProvider } from "@/components/landing/scroll"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { BlockTape } from "@/components/landing/tape"
import { BlocksSection } from "@/components/landing/blocks"
import { HowItWorks } from "@/components/landing/steps"
import { Features } from "@/components/landing/features"
import { UseCases } from "@/components/landing/use-cases"
import { ExportSection } from "@/components/landing/export"
import { Faq } from "@/components/landing/faq"
import { FinalCta } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"
import { ScrollTop } from "@/components/landing/scroll-top"

export function Landing({ isAuth, className }: { isAuth: boolean; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      // `landing` sets the page's typeface and its accent tint (app/globals.css);
      // everything else comes from the app's shadcn theme tokens.
      className={cn(
        "landing relative min-h-0 flex-1 overflow-y-auto bg-background text-foreground motion-safe:scroll-smooth",
        className,
      )}
    >
      <ScrollContainerProvider value={scrollRef}>
        <Navbar scrollRef={scrollRef} isAuth={isAuth} />

        <main>
          {/* The hero and its strip fill the first screen, so the strip runs along
              its bottom edge on any display; 4.25rem is the sticky navbar above. */}
          <div className="flex min-h-[calc(100svh-4.25rem)] flex-col">
            <Hero />
            <BlockTape />
          </div>
          <BlocksSection />
          <HowItWorks />
          <Features />
          <UseCases />
          <ExportSection />
          <Faq />
          <FinalCta />
        </main>

        <Footer isAuth={isAuth} />

        <ScrollTop />
      </ScrollContainerProvider>
    </div>
  )
}
