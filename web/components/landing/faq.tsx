"use client"

import { motion } from "motion/react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FAQ } from "@/components/landing/content"
import { Section, SectionHeader, useReveal } from "@/components/landing/section"

export function Faq() {
  const { item } = useReveal()

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeader
            align="left"
            eyebrow="FAQ"
            title="Questions, answered"
            lead="What it costs, what it exports, and what happens to your work."
          />
        </div>

        <motion.div variants={item}>
          <Accordion type="single" collapsible className="border-t border-border">
            {FAQ.map((entry) => (
              <AccordionItem key={entry.q} value={entry.q} className="border-b">
                <AccordionTrigger className="py-4 text-base font-medium hover:no-underline">
                  {entry.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm text-muted-foreground text-pretty">
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
