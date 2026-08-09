"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { ChartColumn, Copy as CopyIcon, Download, Eye, Star } from "lucide-react"

import { useAccent } from "@/core/client"
import type { ChartConfig } from "@/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Stat } from "@/components/admin/stat"
import { Stars } from "@/components/admin/stars"
import { countryRows, pageRows, RankTable } from "@/components/admin/rank"
import { useRouter } from "next/navigation"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { TopbarPortal } from "@/components/layout/sidebar"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export type StatsPayload = {
  days: number
  totals: Record<string, number>
  series: { day: string; [metric: string]: number | string }[]
  countries: { country: string; count: number }[]
  pages: { path: string; count: number }[]
  rating: { average: number; votes: number }
}

const TILES = [
  { key: "visit", label: "Visits", icon: Eye },
  { key: "download", label: "Downloads", icon: Download },
  { key: "copy", label: "Copies", icon: CopyIcon },
] as const

export function Overview({ stats }: { stats: StatsPayload }) {
  const accent = useAccent()

  const data = stats.series.map((row) => ({
    ...row,
    label: new Date(`${row.day}T00:00:00Z`).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }),
  }))

  const visits = stats.totals.visit ?? 0
  const quiet = TILES.every((tile) => !stats.totals[tile.key])

  return (
    <div className="flex flex-col gap-3">
      <TopbarPortal>
        <RangeSelect days={stats.days} />
      </TopbarPortal>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
        {TILES.map((tile) => {
          const value = stats.totals[tile.key] ?? 0
          const share =
            tile.key === "visit" || !visits ? undefined : `${Math.round((value / visits) * 100)}%`
          return (
            <Stat
              key={tile.key}
              label={tile.label}
              value={value}
              note={share}
              icon={tile.icon}
            />
          )
        })}
        <Stat label="Rating" icon={Star} note={stats.rating.votes ? String(stats.rating.votes) : undefined}>
          {stats.rating.votes > 0 ? (
            <>
              <Stars value={stats.rating.average} />
              <span className="text-base font-medium tabular-nums">
                {stats.rating.average.toFixed(1)}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No votes</span>
          )}
        </Stat>
      </div>

      {quiet ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia className="text-primary">
                  <ChartColumn className="size-10" />
                </EmptyMedia>
                <EmptyTitle>Nothing counted yet</EmptyTitle>
                <EmptyDescription>
                  Visits and exports appear here as they happen.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <>
          <Traffic data={data} accent={accent} />
          <div className="grid gap-3 lg:grid-cols-2">
            <Countries rows={stats.countries} />
            <Pages rows={stats.pages} />
          </div>
        </>
      )}
    </div>
  )
}

function Traffic({ data, accent }: { data: Record<string, unknown>[]; accent: string }) {
  const config = { visit: { label: "Visits", color: accent } } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic</CardTitle>
        <CardDescription>Visits per day</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-56 w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 0, top: 8 }}>
            <defs>
              <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-visit)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-visit)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="visit"
              type="monotone"
              stroke="var(--color-visit)"
              strokeWidth={2}
              fill="url(#traffic-fill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}


function Countries({ rows }: { rows: { country: string; count: number }[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Countries</CardTitle>
        <CardDescription>
          {total.toLocaleString()} visits · {rows.length} countries
        </CardDescription>
      </CardHeader>
      <CardContent className="justify-start p-0">
        <RankTable rows={countryRows(rows)} total={total} limit={6} empty="No visits counted yet." />
      </CardContent>
    </Card>
  )
}

function Pages({ rows }: { rows: { path: string; count: number }[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pages</CardTitle>
        <CardDescription>{total.toLocaleString()} page views</CardDescription>
      </CardHeader>
      <CardContent className="justify-start p-0">
        <RankTable rows={pageRows(rows)} total={total} limit={6} empty="No page views counted yet." />
      </CardContent>
    </Card>
  )
}

// --- Range ---

const RANGES = [
  { value: 1, label: "Today" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
]

// The window lives in the URL, not in state: the page is a Server Component that
// fetches by ?days, so changing it re-fetches on the server and the choice survives a
// reload or a shared link.
function RangeSelect({ days }: { days: number }) {
  const router = useRouter()
  return (
    <NativeSelect
      aria-label="Range"
      size="sm"
      className="w-36 text-xs"
      value={String(days)}
      onChange={(event) => router.replace(`/app?days=${event.target.value}`)}
    >
      {RANGES.map((range) => (
        <NativeSelectOption key={range.value} value={String(range.value)}>
          {range.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
