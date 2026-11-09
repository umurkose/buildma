"use client"

import { Copy, Download, FileCode2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Reveal, SPACE, Section, SectionHeader } from "@/components/landing/section"

const TOKEN = {
  punc: "text-neutral-500",
  tag: "text-sky-400",
  attr: "text-violet-400",
  str: "text-emerald-400",
  txt: "text-neutral-300",
} as const

type Token = [keyof typeof TOKEN, string]

const SNIPPET: Token[][] = [
  [
    ["punc", "<"],
    ["tag", "table"],
    ["txt", " "],
    ["attr", "role"],
    ["punc", "="],
    ["str", '"presentation"'],
    ["txt", " "],
    ["attr", "width"],
    ["punc", "="],
    ["str", '"600"'],
  ],
  [
    ["txt", "       "],
    ["attr", "style"],
    ["punc", "="],
    ["str", '"width:600px;max-width:600px;margin:0 auto"'],
    ["punc", ">"],
  ],
  [["txt", "  "], ["punc", "<"], ["tag", "tr"], ["punc", "><"], ["tag", "td"], ["txt", " "], ["attr", "align"], ["punc", "="], ["str", '"center"']],
  [["txt", "          "], ["attr", "style"], ["punc", "="], ["str", '"padding:32px 24px"'], ["punc", ">"]],
  [
    ["txt", "    "],
    ["punc", "<"],
    ["tag", "div"],
    ["txt", " "],
    ["attr", "style"],
    ["punc", "="],
    ["str", '"font:700 28px/1.3 Arial;color:#111827;'],
  ],
  [["txt", "                "], ["str", 'mso-line-height-rule:exactly"'], ["punc", ">"]],
  [["txt", "      Launch day is here"]],
  [["txt", "    "], ["punc", "</"], ["tag", "div"], ["punc", ">"]],
  [["txt", "  "], ["punc", "</"], ["tag", "td"], ["punc", "></"], ["tag", "tr"], ["punc", ">"]],
  [["txt", "  "], ["punc", "<"], ["tag", "tr"], ["punc", "><"], ["tag", "td"], ["txt", " "], ["attr", "align"], ["punc", "="], ["str", '"center"'], ["punc", ">"]],
  [
    ["txt", "    "],
    ["punc", "<"],
    ["tag", "a"],
    ["txt", " "],
    ["attr", "href"],
    ["punc", "="],
    ["str", '"https://…"'],
    ["txt", " "],
    ["attr", "style"],
    ["punc", "="],
    ["str", '"display:inline-block;'],
  ],
  [["txt", "       "], ["str", 'padding:12px 22px;border-radius:6px;background:#4f46e5"'], ["punc", ">"]],
  [["txt", "      Read the update"]],
  [["txt", "    "], ["punc", "</"], ["tag", "a"], ["punc", ">"]],
  [["txt", "  "], ["punc", "</"], ["tag", "td"], ["punc", "></"], ["tag", "tr"], ["punc", ">"]],
  [["punc", "</"], ["tag", "table"], ["punc", ">"]],
]

export function ExportSection() {
  return (
    <Section id="export" surface="ink">
      <SectionHeader
        eyebrow="Export"
        title="One file. Every inbox."
        lead="The markup already carries what each client needs. You copy it, or download it, and send."
      />

      <Reveal className={cn(SPACE.content, "mx-auto max-w-4xl")}>
        <div className="overflow-hidden rounded-[1.75rem] bg-[oklch(0.15_0.02_275)] ring-1 ring-white/10 shadow-[0_40px_80px_-40px_oklch(0_0_0/0.7)]">
          <div className="flex items-center gap-2 border-b border-white/10 px-6 py-3">
            <span aria-hidden className="mr-1 flex gap-1.5">
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/20" />
            </span>
            <FileCode2 aria-hidden className="size-3.5 shrink-0 text-white/50" />
            <span className="flex-1 truncate font-mono text-[11px] text-white/60">
              launch-announcement.html
            </span>
            {/* Pictures of the editor's buttons, not buttons: nothing here to press. */}
            <span
              aria-hidden
              className="hidden h-7 items-center gap-1 rounded-full border border-white/15 px-2.5 text-xs font-medium text-white/80 sm:inline-flex"
            >
              <Copy className="size-3" />
              Copy
            </span>
            <span
              aria-hidden
              className="inline-flex h-7 items-center gap-1 rounded-full bg-primary px-2.5 text-xs font-medium text-primary-foreground"
            >
              <Download className="size-3" />
              Download
            </span>
          </div>
          <div className="overflow-x-auto p-6">
            <pre className="font-mono text-[11px] leading-[1.9] whitespace-pre sm:text-xs">
              {SNIPPET.map((line, i) => (
                <div key={i}>
                  {line.map(([kind, value], j) => (
                    <span key={j} className={TOKEN[kind]}>
                      {value}
                    </span>
                  ))}
                </div>
              ))}
            </pre>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
