"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { BLOCKS } from "@/components/landing/content"
import { icon as resolveIcon } from "@/components/landing/icons"
import { TILE } from "@/components/landing/tiles"
import { BlockThumb } from "@/components/builder/thumbs"
import type { BlockType } from "@/components/builder/store"
import { SPACE, Section, SectionHeader, useReveal } from "@/components/landing/section"

// A gallery: every block as a card showing what it looks like in an email, with
// the "14" card as the fifteenth cell. Fifteen fills five columns, three columns
// and (with the last card spanning both) two columns without a gap.
export function BlocksSection() {
  const { item } = useReveal()

  return (
    <Section id="blocks">
      <SectionHeader
        eyebrow="Blocks"
        title="Every block an email actually needs"
        lead="Fourteen of them. Drag any one onto the canvas, as many times as you like."
      />

      <ul
        className={cn(
          SPACE.content,
          SPACE.grid,
          "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        )}
      >
        {BLOCKS.map((block) => {
          const Icon = resolveIcon(block.icon)
          return (
            <motion.li
              key={block.key}
              variants={item}
              className="group flex flex-col rounded-[1.5rem] bg-muted/50 p-4 transition-colors duration-300 ease-out hover:bg-muted sm:rounded-[2rem] sm:p-6"
            >
              <div
                aria-hidden
                className="flex h-24 items-center justify-center rounded-xl bg-white px-4 text-[10px] text-neutral-900 sm:text-[11px] shadow-[0_10px_24px_-16px_oklch(0_0_0/0.4),0_0_0_1px_oklch(0_0_0/0.05)] transition-shadow duration-300 select-none group-hover:shadow-[0_14px_30px_-16px_oklch(0_0_0/0.45),0_0_0_1.5px_var(--color-primary)]"
              >
                <BlockThumb type={block.key as BlockType} />
              </div>
              <div className="mt-5 flex items-center gap-2.5 sm:mt-6">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    TILE,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 truncate font-semibold">{block.label}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">{block.desc}</p>
            </motion.li>
          )
        })}

        <motion.li variants={item} className="col-span-2 md:col-span-1">
          <Link
            href="/editor"
            aria-label="See the blocks"
            className="group relative flex h-full min-h-48 flex-col justify-between overflow-hidden rounded-[1.5rem] bg-primary p-4 text-primary-foreground shadow-[0_24px_48px_-28px_var(--color-primary)] transition-shadow duration-300 ease-out outline-none focus-visible:ring-3 focus-visible:ring-primary/50 hover:shadow-[0_32px_56px_-24px_var(--color-primary)] sm:rounded-[2rem] sm:p-6"
          >
            <BrickCluster />
            <p className="text-6xl leading-none font-bold tracking-[-0.04em]">{BLOCKS.length}</p>
            <span className="inline-flex items-center gap-2 self-start text-base font-semibold">
              See the blocks
              <ArrowRight className="size-4.5 transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-1" />
            </span>
          </Link>
        </motion.li>
      </ul>
    </Section>
  )
}

// Four blocks hopping one after another, like keys being played. Hovering the card
// spreads them apart.
const CLUSTER = ["bg-white", "bg-white/30", "bg-white/30", "bg-white"]

function BrickCluster() {
  const reduce = useReducedMotion()
  return (
    <div
      aria-hidden
      className="absolute top-4 right-4 grid grid-cols-2 gap-1.5 transition-[gap] duration-300 ease-out group-hover:gap-2.5 sm:top-6 sm:right-6"
    >
      {CLUSTER.map((fill, i) => (
        <motion.span
          key={i}
          className={cn("brick size-6 rounded-lg", fill)}
          animate={reduce ? undefined : { y: [0, -5, 0, 0] }}
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
