import type { ReactNode } from "react"
import { MoveVertical, Quote } from "lucide-react"

import { cn } from "@/lib/utils"
import type { BlockType } from "@/components/builder/store"

// A schematic picture of every block as it renders inside an email: neutral ink on
// white paper, the accent wherever the block itself would carry colour. Shared by
// the landing page's block gallery and the editor's palette.
//
// Everything is sized in em, so one set of pictures works at any scale: put the
// thumbnail on white paper and set the font size on that container (about 11px for
// a large card, 7–8px for a palette tile).

const line = "h-[0.55em] rounded-full bg-neutral-200"

const THUMBS: Record<BlockType, () => ReactNode> = {
  heading: () => (
    <div className="w-full">
      <p className="text-[1.36em] leading-tight font-bold tracking-tight">Launch day is here</p>
      <div className={cn(line, "mt-[0.7em] w-2/3")} />
    </div>
  ),
  text: () => (
    <div className="flex w-full flex-col gap-[0.55em]">
      <div className={cn(line, "w-full")} />
      <div className={cn(line, "w-full")} />
      <div className={cn(line, "w-3/5")} />
    </div>
  ),
  richtext: () => (
    <p className="text-[1em] leading-relaxed text-neutral-500">
      <b className="text-neutral-900">Bold</b>, <i>italic</i> and a{" "}
      <span className="font-medium text-primary underline underline-offset-2">link</span> in one
      paragraph.
    </p>
  ),
  list: () => (
    <div className="flex w-full flex-col gap-[0.7em]">
      {["w-4/5", "w-3/5", "w-2/3"].map((w) => (
        <div key={w} className="flex items-center gap-[0.7em]">
          <span className="size-[0.55em] shrink-0 rounded-full bg-primary" />
          <div className={cn(line, w)} />
        </div>
      ))}
    </div>
  ),
  quote: () => (
    <div className="flex w-full gap-[0.9em]">
      <Quote className="size-[1.45em] shrink-0 fill-primary text-primary" />
      <div className="flex flex-1 flex-col gap-[0.55em]">
        <div className={cn(line, "w-full")} />
        <div className={cn(line, "w-4/5")} />
        <div className="mt-[0.2em] h-[0.55em] w-1/3 rounded-full bg-neutral-300" />
      </div>
    </div>
  ),
  callout: () => (
    <div className="w-full rounded-[0.5em] border-l-[0.27em] border-primary bg-primary/10 px-[0.9em] py-[0.7em]">
      <div className="h-[0.55em] w-1/2 rounded-full bg-primary/40" />
      <div className="mt-[0.55em] h-[0.55em] w-4/5 rounded-full bg-primary/20" />
    </div>
  ),
  table: () => (
    <div className="grid w-full grid-cols-3 overflow-hidden rounded-[0.5em] border border-neutral-200">
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-[1.45em] border-neutral-200",
            i % 3 !== 2 && "border-r",
            i < 6 && "border-b",
            i < 3 && "bg-neutral-100",
          )}
        />
      ))}
    </div>
  ),
  image: () => (
    <div className="relative h-[5em] w-full overflow-hidden rounded-[0.5em] bg-linear-to-br from-[color-mix(in_oklab,var(--primary)_22%,white)] to-[color-mix(in_oklab,var(--primary)_55%,white)]">
      <span className="absolute top-[0.7em] right-[1.1em] size-[1.3em] rounded-full bg-white/80" />
      <span className="absolute -bottom-[1.8em] -left-[0.2em] h-[3.6em] w-[7.3em] rounded-[1.5em] bg-white/50" />
      <span className="absolute -right-[0.3em] -bottom-[2.2em] h-[3.6em] w-[8.7em] rounded-[1.5em] bg-white/35" />
    </div>
  ),
  columns: () => (
    <div className="grid w-full grid-cols-2 gap-[0.7em]">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-[0.5em] bg-neutral-100 p-[0.55em]">
          <div className="h-[1.8em] rounded-[0.3em] bg-[color-mix(in_oklab,var(--primary)_25%,white)]" />
          <div className={cn(line, "mt-[0.55em] w-4/5")} />
        </div>
      ))}
    </div>
  ),
  button: () => (
    <span className="inline-flex h-[2.9em] items-center rounded-full bg-primary px-[1.45em] text-[1em] font-semibold whitespace-nowrap text-primary-foreground">
      Get started
    </span>
  ),
  menu: () => (
    <div className="flex items-center gap-[0.8em] text-[1em] font-medium whitespace-nowrap text-neutral-500">
      <span className="text-neutral-900">Home</span>
      <span>About</span>
      <span>Contact</span>
    </div>
  ),
  social: () => (
    <div className="flex gap-[0.7em]">
      {["bg-neutral-900", "bg-primary", "bg-neutral-400"].map((fill) => (
        <span key={fill} className={cn("size-[2.2em] rounded-full", fill)} />
      ))}
    </div>
  ),
  divider: () => (
    <div className="flex w-full flex-col gap-[0.9em]">
      <div className={cn(line, "w-2/3")} />
      <div className="h-px w-full bg-neutral-300" />
      <div className={cn(line, "w-1/2")} />
    </div>
  ),
  spacer: () => (
    <div className="flex w-full flex-col items-center gap-[0.35em]">
      <div className={cn(line, "w-full")} />
      <div className="flex h-[2.5em] w-full items-center justify-center rounded-[0.5em] border border-dashed border-neutral-300">
        <MoveVertical className="size-[1.3em] text-neutral-400" />
      </div>
      <div className={cn(line, "w-full")} />
    </div>
  ),
}

/** The block's picture. Place it on white paper; size it with the container's font size. */
export function BlockThumb({ type }: { type: BlockType }) {
  const Thumb = THUMBS[type]
  return <Thumb />
}
