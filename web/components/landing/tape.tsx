"use client"

import { Marquee } from "@/components/ui/marquee"
import { BLOCKS, PROOFS } from "@/components/landing/content"
import { icon as resolveIcon } from "@/components/landing/icons"
import { CANDY, candyOf } from "@/components/landing/candy"
import { cn } from "@/lib/utils"

// Two strips running in opposite directions: the promises on yellow, then every
// block in its group colour on ink. Pure decoration — the same names are in the
// Blocks section — so it stays out of the accessibility tree. Reduced motion
// parks both strips (the Marquee pauses itself).
export function BlockTape() {
  return (
    <div aria-hidden className="overflow-x-clip select-none">
      <div className="bg-candy-sun py-2.5 text-ink">
        <Marquee reverse className="p-0 [--duration:55s] [--gap:2rem]">
          {PROOFS.map(({ icon: name, label }) => {
            const Icon = resolveIcon(name)
            return (
              <span key={label} className="inline-flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4" />
                {label}
              </span>
            )
          })}
        </Marquee>
      </div>

      <div className="bg-foreground py-3.5 text-background">
        <Marquee className="p-0 [--duration:45s] [--gap:2.25rem]">
          {BLOCKS.map((block) => (
            <span
              key={block.key}
              className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.02em]"
            >
              <span className={cn("brick size-4 rounded-[5px]", CANDY[candyOf(block.key)].solid)} />
              {block.label}
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  )
}
