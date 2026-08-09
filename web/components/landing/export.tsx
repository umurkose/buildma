"use client"

import { Copy, Download, FileCode2 } from "lucide-react"

import { Reveal, SectionHeader } from "@/components/landing/section"
import { Button } from "@/components/ui/button"

const TOKEN = {
  punc: "text-neutral-500",
  tag: "text-sky-400",
  attr: "text-violet-400",
  str: "text-emerald-400",
  note: "text-neutral-500 italic",
  txt: "text-neutral-300",
} as const

type Token = [keyof typeof TOKEN, string]

const SNIPPET: Token[][] = [
  [["note", "<!-- 600px · table-based · every style inline -->"]],
  [["note", "<!--[if mso]>"], ["txt", " ghost table pins the width in Outlook "], ["note", "<![endif]-->"]],
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
    <section
      id="export"
      className="flex w-full min-w-0 scroll-mt-20 flex-col justify-center border-t border-border py-20 sm:py-24 lg:min-h-svh"
    >
      <div className="mx-auto w-full max-w-4xl px-5">
        <SectionHeader
          eyebrow="Export"
          title="One file. Every inbox."
          lead="The markup already carries what each client needs. You copy it, or download it, and send."
        />

        <Reveal className="mt-12">
          <div className="overflow-hidden rounded-2xl border border-border bg-neutral-950">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <FileCode2 className="size-3.5 shrink-0 text-neutral-400" />
              <span className="flex-1 truncate font-mono text-[11px] text-neutral-400">
                launch-announcement.html
              </span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                className="hidden border-white/15 bg-transparent text-neutral-300 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <Copy data-icon="inline-start" />
                Copy
              </Button>
              <Button type="button" size="xs">
                <Download data-icon="inline-start" />
                Download
              </Button>
            </div>
            <div className="overflow-x-auto p-5 sm:p-6">
              <pre className="font-mono text-[11px] leading-[1.9] whitespace-pre sm:text-xs">
                {SNIPPET.map((line, i) => (
                  <div key={i}>
                    {line.length === 0
                      ? " "
                      : line.map(([kind, value], j) => (
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

      </div>
    </section>
  )
}
