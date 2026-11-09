"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FAQ } from "@/components/landing/content"
import { CANDY } from "@/components/landing/candy"
import { SPACE, Section, SectionHeader, useReveal } from "@/components/landing/section"

export function Faq() {
  const { item } = useReveal()

  return (
    <Section id="faq">
      {/* Stacked, the header sits the same distance above the questions as every
          other section header sits above its content. */}
      <div className="grid gap-14 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeader
            align="left"
            eyebrow="FAQ"
            title="Questions, answered"
            lead="What it costs, what it exports, and what happens to your work."
          />
          {/* Three blocks laid flat under the heading — the logo's own bars — on
              wide screens only. */}
          <motion.div
            variants={item}
            aria-hidden
            className={cn(SPACE.content, "hidden flex-col gap-2 lg:flex")}
          >
            <span className="brick h-9 w-48 rounded-xl bg-candy-sun" />
            <span className="brick h-9 w-36 rounded-xl bg-candy-sky" />
            <span className="brick h-9 w-24 rounded-xl bg-candy-sun" />
          </motion.div>
        </div>

        <motion.div variants={item}>
          <Accordion type="single" collapsible className={SPACE.grid}>
            {FAQ.map((entry) => (
              <AccordionItem
                key={entry.q}
                value={entry.q}
                className={cn(
                  "rounded-2xl border border-border bg-card px-6 transition-colors duration-300 data-[state=open]:border-transparent",
                  CANDY.sun.open,
                )}
              >
                <AccordionTrigger className="items-center py-5 text-base font-semibold hover:no-underline hover:text-foreground">
                  {entry.q}
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-[0.95rem] text-muted-foreground text-pretty">
                  {entry.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </Section>
  )
}
