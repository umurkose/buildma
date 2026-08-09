"use client"

import { useEffect, useRef, useState } from "react"
import { Monitor, Smartphone } from "lucide-react"

import { formatBytes, formatDateTime } from "@/lib/format"
import { countries as COUNTRIES, flagSrc } from "@/lib/countries"
import { META, type BlockType } from "@/components/builder/store"
import type { ExportRow } from "@/types"
import { Button } from "@/components/ui/button"
import { Stars } from "@/components/admin/stars"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const WIDTH = { desktop: 640, mobile: 390 } as const
const HEIGHT = 1400

export function ExportPreview({ row }: { row: ExportRow }) {
  return (
    <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col gap-0">
      <div className="flex shrink-0 items-center border-b border-border px-4 py-2">
        <TabsList className="w-full">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="details" className="min-h-0 flex-1 overflow-y-auto">
        <Details row={row} />
      </TabsContent>

      <TabsContent value="template" className="flex min-h-0 flex-1 flex-col">
        <Template row={row} />
      </TabsContent>
    </Tabs>
  )
}

function Template({ row }: { row: ExportRow }) {
  const [device, setDevice] = useState<keyof typeof WIDTH>("desktop")

  const frame = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState(0)
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvail(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const width = WIDTH[device]
  const scale = avail ? Math.min(1, avail / width) : 1

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
        <span className="truncate text-xs text-muted-foreground">
          {device === "desktop" ? "Desktop" : "Mobile"}
        </span>
        <DeviceToggle device={device} onChange={setDevice} />
      </div>

      <div
        ref={frame}
        className="min-h-0 flex-1 overflow-auto border-t border-border bg-muted/40 bg-[radial-gradient(color-mix(in_oklab,var(--color-foreground)_12%,transparent)_1px,transparent_1px)] bg-size-[16px_16px] p-4"
      >
        <div
          className="mx-auto overflow-hidden transition-[width,height] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: width * scale, height: HEIGHT * scale }}
        >
          <iframe
            key={device}
            title="Exported email"
            sandbox=""
            srcDoc={row.html}
            className="block border-0 bg-white"
            style={{
              width,
              height: HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    </>
  )
}

function Details({ row }: { row: ExportRow }) {
  const country = row.country ? COUNTRIES.find((c) => c.code === row.country) : undefined

  const used = new Map<string, number>()
  for (const type of row.blockTypes.split(",").filter(Boolean))
    used.set(type, (used.get(type) ?? 0) + 1)

  const fields: { label: string; value: React.ReactNode }[] = [
    { label: "Action", value: row.kind === "copy" ? "Copied" : "Downloaded" },
    { label: "When", value: formatDateTime(row.createdAt) },
    {
      label: "Country",
      value: country ? (
        <span className="inline-flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagSrc(country.code)}
            alt=""
            className="h-3.5 w-5 shrink-0 rounded-xs object-cover ring-1 ring-border"
          />
          {country.name}
        </span>
      ) : (
        (row.country ?? "—")
      ),
    },
    { label: "Blocks", value: row.blocks },
    { label: "Size", value: formatBytes(row.bytes) },
    {
      label: "Rating",
      value: row.rating ? (
        <span className="inline-flex items-center gap-2">
          <Stars value={row.rating} />
          <span className="tabular-nums">{row.rating}</span>
        </span>
      ) : (
        "—"
      ),
    },
  ]

  return (
    <>
      <table className="w-full text-sm">
        <tbody>
          {fields.map((field) => (
            <tr key={field.label} className="border-b border-border/60">
              <td className="py-2.5 pr-2 pl-4 text-muted-foreground">{field.label}</td>
              <td className="py-2.5 pr-4 text-right">{field.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-2 p-4">
        <span className="text-xs font-medium text-muted-foreground">Blocks used</span>
        {used.size === 0 ? (
          <p className="text-sm text-muted-foreground">Not recorded for this export.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {[...used.entries()].map(([type, count]) => {
              const meta = META[type as BlockType]
              const Icon = meta?.icon
              return (
                <li
                  key={type}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs"
                >
                  {Icon && <Icon className="size-3.5 text-primary" />}
                  {meta?.label ?? type}
                  {count > 1 && (
                    <span className="tabular-nums text-muted-foreground">×{count}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}

function DeviceToggle({
  device,
  onChange,
}: {
  device: keyof typeof WIDTH
  onChange: (value: keyof typeof WIDTH) => void
}) {
  return (
    <div role="radiogroup" aria-label="Preview width" className="flex items-center gap-1">
      {(
        [
          ["desktop", Monitor, "Desktop"],
          ["mobile", Smartphone, "Mobile"],
        ] as const
      ).map(([value, Icon, label]) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              role="radio"
              aria-checked={device === value}
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(value)}
              className="aria-checked:bg-primary aria-checked:text-primary-foreground aria-checked:hover:bg-primary! aria-checked:hover:text-primary-foreground!"
            >
              <Icon />
              <span className="sr-only">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
