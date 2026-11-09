"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { BLOCKS } from "@/components/landing/content"
import { icon as resolveIcon } from "@/components/landing/icons"
import { BLOCK_GROUPS, CANDY, type Candy } from "@/components/landing/candy"
import { SPACE, Section, SectionHeader, useReveal } from "@/components/landing/section"

const byKey = new Map(BLOCKS.map((block) => [block.key, block]))

// Text holds six blocks, so it takes the full height of the first column while the
// shorter groups pair up beside it.
const PLACEMENT: Record<string, string> = {
  text: "md:row-span-2",
  media: "",
  layout: "lg:col-start-2 lg:row-start-2",
  actions: "lg:col-start-3 lg:row-start-1",
}

export function BlocksSection() {
  const { item } = useReveal()

  return (
    <Section id="blocks">
      <SectionHeader
        eyebrow="Blocks"
        title="Every block an email actually needs"
        lead="Fourteen of them. Drag any one onto the canvas, as many times as you like."
      />

      <div
        className={cn(SPACE.content, SPACE.grid, "grid md:grid-cols-2 lg:grid-cols-3")}
      >
        {BLOCK_GROUPS.map((group) => (
          <motion.div
            key={group.key}
            variants={item}
            className={cn(
              SPACE.card,
              "flex flex-col border border-border bg-card",
              PLACEMENT[group.key],
            )}
          >
            <h3 className="font-display text-2xl leading-none font-bold tracking-[-0.03em]">
              {group.label}
            </h3>

            <ul className="mt-5 flex flex-col gap-2">
              {group.blocks.map((key) => {
                const block = byKey.get(key)
                if (!block) return null
                const Icon = resolveIcon(block.icon)
                return (
                  <li
                    key={key}
                    className="group/block flex items-center gap-3 rounded-2xl bg-background p-2.5 pr-4 transition-transform duration-200 ease-out motion-safe:hover:-translate-y-0.5"
                  >
                    <span
                      className={cn(
                        "brick flex size-11 shrink-0 items-center justify-center rounded-xl text-ink transition-transform duration-300 ease-out motion-safe:group-hover/block:scale-110",
                        CANDY[group.candy].solid,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{block.label}</span>
                      <span className="block text-sm text-muted-foreground">{block.desc}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        ))}

        <motion.div variants={item} className="lg:col-start-3 lg:row-start-2">
          <Link
            href="/editor"
            aria-label="See the blocks"
            className={cn(
              SPACE.card,
              "group surface-ink relative flex h-full min-h-56 flex-col justify-between overflow-hidden shadow-[0_24px_48px_-28px_oklch(0_0_0/0.6)] transition-[translate,box-shadow] duration-300 ease-out outline-none focus-visible:ring-3 focus-visible:ring-primary/50 motion-safe:hover:-translate-y-1 hover:shadow-[0_32px_56px_-26px_oklch(0_0_0/0.7)]",
            )}
          >
            <BrickCluster />
            <p className="font-display text-7xl leading-none font-extrabold tracking-[-0.04em]">
              {BLOCKS.length}
            </p>
            <span className="inline-flex items-center gap-2 self-start text-base font-semibold transition-colors duration-200 group-hover:text-candy-sun">
              See the blocks
              <ArrowRight className="size-4.5 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-1" />
            </span>
          </Link>
        </motion.div>
      </div>
    </Section>
  )
}

// Four blocks hopping one after another, like keys being played. Hovering the card
// spreads them apart.
const CLUSTER: Candy[] = ["sun", "sky", "sky", "sun"]

function BrickCluster() {
  const reduce = useReducedMotion()
  return (
    <div
      aria-hidden
      className="absolute top-6 right-6 grid grid-cols-2 gap-1.5 transition-[gap] duration-300 ease-out group-hover:gap-3"
    >
      {CLUSTER.map((candy, i) => (
        <motion.span
          key={i}
          className={cn("brick size-8 rounded-xl", CANDY[candy].solid)}
          animate={reduce ? undefined : { y: [0, -6, 0, 0] }}
          transition={
            reduce
              ? undefined
              : {
                  duration: 1.8,
                  times: [0, 0.18, 0.4, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.22,
                }
          }
        />
      ))}
    </div>
  )
}
