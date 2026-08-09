"use client"

import { useRef } from "react"

import { ScrollContainerProvider } from "@/components/landing/scroll"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { BlocksSection } from "@/components/landing/blocks"
import { HowItWorks } from "@/components/landing/steps"
import { ExportSection } from "@/components/landing/export"
import { Faq } from "@/components/landing/faq"
import { FinalCta } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"
import { ScrollTop } from "@/components/landing/scroll-top"

export function Landing({ isAuth }: { isAuth: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollRef}
      className="relative min-h-0 flex-1 overflow-y-auto motion-safe:scroll-smooth"
    >
      <ScrollContainerProvider value={scrollRef}>
        <Navbar scrollRef={scrollRef} isAuth={isAuth} />

        <main>
          <Hero />
          <BlocksSection />
          <HowItWorks />
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
