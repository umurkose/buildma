"use client"

import Link from "next/link"
import { ArrowRight, GripVertical } from "lucide-react"

import { Marquee } from "@/components/ui/marquee"
import { BLOCKS } from "@/components/landing/content"
import { icon as resolveIcon } from "@/components/landing/icons"
import { Reveal, Section, SectionHeader } from "@/components/landing/section"

const CARD = 272
type Card = (typeof BLOCKS)[number] & { Icon: ReturnType<typeof resolveIcon> }
const withIcon = (block: (typeof BLOCKS)[number]): Card => ({ ...block, Icon: resolveIcon(block.icon) })
const TOP = BLOCKS.slice(0, 7).map(withIcon)
const BOTTOM = BLOCKS.slice(7).map(withIcon)

function BlockCard({ block }: { block: Card }) {
  return (
    <div
      style={{ width: CARD }}
      className="group/card flex shrink-0 cursor-default items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-200 ease-out hover:border-primary/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-transparent text-primary transition-all duration-200 ease-out group-hover/card:bg-primary/10">
        <block.Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{block.label}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{block.desc}</span>
      </span>
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50 transition-all duration-200 ease-out group-hover/card:text-primary" />
    </div>
  )
}

export function BlocksSection() {
  return (
    <Section id="blocks" tone="muted">
      <SectionHeader
        eyebrow="Blocks"
        title="Every block an email actually needs"
        lead="Fourteen of them. Drag any one onto the canvas, as many times as you like."
      />

      <div className="mt-12 flex flex-col gap-3 [mask-image:linear-gradient(to_right,transparent,black_4rem,black_calc(100%-4rem),transparent)]">
        <Marquee
          pauseOnHover
          className="p-0 [--duration:46s] [--gap:0.75rem] motion-reduce:[&>div]:w-full motion-reduce:[&>div]:animate-none motion-reduce:[&>div]:flex-wrap motion-reduce:[&>div]:justify-center motion-reduce:[&>div:not(:first-child)]:hidden"
        >
          {TOP.map((block) => (
            <BlockCard key={block.key} block={block} />
          ))}
        </Marquee>
        <Marquee
          reverse
          pauseOnHover
          className="p-0 [--duration:46s] [--gap:0.75rem] motion-reduce:[&>div]:w-full motion-reduce:[&>div]:animate-none motion-reduce:[&>div]:flex-wrap motion-reduce:[&>div]:justify-center motion-reduce:[&>div:not(:first-child)]:hidden"
        >
          {BOTTOM.map((block) => (
            <BlockCard key={block.key} block={block} />
          ))}
        </Marquee>
      </div>

      <Reveal className="mt-10 flex justify-center">
        <Link
          href="/editor"
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 ease-out hover:bg-primary/90 active:scale-[0.98]"
        >
          See the blocks
          <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
        </Link>
      </Reveal>
    </Section>
  )
}
