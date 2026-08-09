"use client"

import { Copy, Download, Star } from "lucide-react"

import { formatBytes, formatDateTime } from "@/lib/format"
import { countries as COUNTRIES, flagSrc } from "@/lib/countries"
import type { ColumnDef, ExportRow } from "@/types"
import { Table } from "@/components/ui/table"
import { Stat } from "@/components/admin/stat"
import { Stars } from "@/components/admin/stars"

const KINDS = {
  download: { label: "Downloaded", icon: Download },
  copy: { label: "Copied", icon: Copy },
} as const

const columns: ColumnDef<ExportRow>[] = [
  {
    accessorKey: "kind",
    header: "Action",
    cell: ({ row }) => {
      const kind = KINDS[row.original.kind]
      const Icon = kind?.icon ?? Download
      return (
        <span className="flex items-center gap-2 whitespace-nowrap text-muted-foreground">
          <Icon className="size-4 shrink-0" />
          {kind?.label ?? row.original.kind}
        </span>
      )
    },
  },
  {
    accessorKey: "blocks",
    header: "Blocks",
    cell: ({ row }) => <span className="tabular-nums">{row.original.blocks}</span>,
  },
  {
    accessorKey: "bytes",
    header: "Size",
    meta: { muted: true },
    cell: ({ row }) => <span className="tabular-nums">{formatBytes(row.original.bytes)}</span>,
  },
  {
    accessorKey: "country",
    header: "From",
    cell: ({ row }) => {
      const code = row.original.country
      const country = code ? COUNTRIES.find((c) => c.code === code) : undefined
      if (!country)
        return <span className="text-muted-foreground">{code ?? "—"}</span>
      return (
        <span className="flex items-center gap-2 whitespace-nowrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagSrc(country.code)}
            alt=""
            className="h-3.5 w-5 shrink-0 rounded-xs object-cover ring-1 ring-border"
          />
          {country.name}
        </span>
      )
    },
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) =>
      row.original.rating ? (
        <Stars value={row.original.rating} />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "When",
    meta: { muted: true },
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
]

export function DownloadsTable({
  rows,
  downloads,
  copies,
}: {
  rows: ExportRow[]
  downloads: number
  copies: number
}) {
  const rated = rows.filter((row) => row.rating)
  const average = rated.length
    ? rated.reduce((sum, row) => sum + (row.rating ?? 0), 0) / rated.length
    : 0
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
        <Stat label="Downloads" value={downloads} icon={Download} />
        <Stat label="Copies" value={copies} icon={Copy} />
        <Stat
          label="Rating"
          icon={Star}
          note={rated.length ? String(rated.length) : undefined}
        >
          {rated.length ? (
            <>
              <Stars value={average} />
              <span className="text-base font-medium tabular-nums">{average.toFixed(1)}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No votes</span>
          )}
        </Stat>
      </div>

      <Table
        columns={columns}
        data={rows}
        label="emails"
        paginate={false}
        topbar
        rowHref={(row) => `/app/downloads/${row.id}`}
        getRowId={(row) => row.id}
      />
    </div>
  )
}
