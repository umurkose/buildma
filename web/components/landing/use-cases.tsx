"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { USE_CASES } from "@/components/landing/content"
import { icon as resolveIcon } from "@/components/landing/icons"
import { CANDY, cycle } from "@/components/landing/candy"
import { SPACE, Section, SectionHeader, useReveal } from "@/components/landing/section"

export function UseCases() {
  const { item } = useReveal()

  return (
    <Section id="use-cases">
      <SectionHeader eyebrow="Use cases" title="One builder for every email you send" />

      <ul className={cn(SPACE.content, SPACE.grid, "grid sm:grid-cols-2 lg:grid-cols-3")}>
        {USE_CASES.map((useCase, i) => {
          const Icon = resolveIcon(useCase.icon)
          return (
            <motion.li
              key={useCase.key}
              variants={item}
              className={cn(
                SPACE.card,
                "group flex flex-col border border-border bg-card transition-[translate,box-shadow] duration-300 ease-out hover:shadow-[0_24px_48px_-30px_oklch(0_0_0/0.4)] motion-safe:hover:-translate-y-1",
              )}
            >
              <span
                className={cn(
                  "brick flex size-12 items-center justify-center rounded-2xl text-ink transition-transform duration-300 ease-out motion-safe:group-hover:scale-110",
                  CANDY[cycle(i)].solid,
                )}
              >
                <Icon className="size-5" />
              </span>
              <h3 className={cn(SPACE.afterVisual, "font-display text-xl font-bold tracking-[-0.02em]")}>
                {useCase.title}
              </h3>
              <p className={cn(SPACE.body, "text-muted-foreground text-pretty")}>{useCase.body}</p>
            </motion.li>
          )
        })}
      </ul>
    </Section>
  )
}
