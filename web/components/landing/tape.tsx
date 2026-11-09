"use client"

import { Marquee } from "@/components/ui/marquee"
import { PROOFS } from "@/components/landing/content"
import { icon as resolveIcon } from "@/components/landing/icons"

// One strip of promises on the accent, running under the hero. Pure decoration —
// the same claims are made in the sections below — so it stays out of the
// accessibility tree. Reduced motion parks it (the Marquee pauses itself).
export function BlockTape() {
  return (
    <div aria-hidden className="overflow-x-clip bg-primary py-2.5 text-primary-foreground select-none">
      <Marquee reverse className="p-0 [--duration:55s] [--gap:2rem]">
        {PROOFS.map(({ icon: name, label }) => {
          const Icon = resolveIcon(name)
          return (
            <span key={label} className="inline-flex items-center gap-2 text-sm font-medium">
              <Icon className="size-4" />
              {label}
            </span>
          )
        })}
      </Marquee>
    </div>
  )
}
