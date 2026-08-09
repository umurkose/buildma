"use client"

import { Circle, LogIn, Mail, MessageSquare, UserPlus } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import type { ColumnDef, LogEntry } from "@/types"
import { Status } from "@/components/ui/status"
import { Table } from "@/components/ui/table"

export const EVENTS: Record<LogEntry["event"], { label: string; icon: typeof Mail }> = {
  "verification.sent": { label: "Code sent", icon: Mail },
  "user.registered": { label: "New User", icon: UserPlus },
  "user.signed_in": { label: "Signed in", icon: LogIn },
}

const eventCol: ColumnDef<LogEntry> = {
  accessorKey: "event",
  header: "Event",
  cell: ({ row }) => {
    const { event, channel } = row.original
    const known = EVENTS[event] ?? { label: event, icon: Circle }
    const Icon = channel === "sms" ? MessageSquare : known.icon
    return (
      <span className="flex items-center gap-2 whitespace-nowrap text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        {known.label}
      </span>
    )
  },
}

const subjectCol: ColumnDef<LogEntry> = {
  accessorKey: "subject",
  header: "Subject",
  meta: { copy: true },
  cell: ({ row }) => <span className="font-medium">{row.original.subject}</span>,
}

const codeCol: ColumnDef<LogEntry> = {
  accessorKey: "code",
  header: "Code",
  meta: { copy: true, mono: true },
  cell: ({ row }) =>
    row.original.code ? (
      <span className="tracking-widest">{row.original.code}</span>
    ) : (
      <span className="text-muted-foreground">—</span>
    ),
}

const statusCol: ColumnDef<LogEntry> = {
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) =>
    row.original.status === "ok" ? (
      <Status tone="success">OK</Status>
    ) : (
      <Status tone="danger">Failed</Status>
    ),
}

const timeCol: ColumnDef<LogEntry> = {
  accessorKey: "createdAt",
  header: "Time",
  meta: { muted: true },
  cell: ({ row }) => formatDateTime(row.original.createdAt),
}

const columns: ColumnDef<LogEntry>[] = [eventCol, statusCol, subjectCol, codeCol, timeCol]

export function LogsTable({
  logs,
  onRefresh,
  topbar = false,
}: {
  logs: LogEntry[]
  onRefresh?: () => void
  topbar?: boolean
}) {
  return (
    <Table
      columns={columns}
      data={logs}
      globalSearch
      searchPlaceholder="Search email or phone"
      label="events"
      paginate={false}
      refreshable
      topbar={topbar}
      onRefresh={onRefresh}
      rowHref={(log) => `/app/logs/${log.id}`}
      getRowId={(log) => String(log.id)}
    />
  )
}
