"use client"

import { ArrowUpRight, Circle } from "lucide-react"
import Link from "next/link"
import { countries, flagSrc } from "@/lib/countries"
import { formatDateTime } from "@/lib/format"
import type { LogEntry } from "@/types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Status } from "@/components/ui/status"
import { Copy } from "@/components/ui/copy"
import { Row } from "@/components/ui/row"
import { EVENTS } from "../table"

function Country({ code }: { code: string | null }) {
  if (!code) return null
  const country = countries.find((c) => c.code === code)
  return (
    <span className="inline-flex items-center gap-2">
      {country && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flagSrc(code)} alt="" className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" />
      )}
      {country?.name ?? code}
    </span>
  )
}

function readAgent(ua: string | null) {
  if (!ua) return null
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : null
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : null
  return { browser, os, device: /Mobile|Android|iPhone|iPad/.test(ua) ? "Mobile" : "Desktop" }
}

export function LogDetail({ log }: { log: LogEntry }) {
  const { label, icon: EventIcon } = EVENTS[log.event] ?? { label: log.event, icon: Circle }
  const agent = readAgent(log.userAgent)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0 space-y-1">
          <h2 className="flex min-w-0 items-center gap-2 font-medium">
            <EventIcon className="size-4 shrink-0" />
            {label}
          </h2>
          <Copy value={log.subject} className="text-sm text-muted-foreground">
            {log.subject}
          </Copy>
        </div>
        <div className="shrink-0">
          {log.status === "ok" ? (
            <Status tone="success">OK</Status>
          ) : (
            <Status tone="danger">Failed</Status>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Event</CardTitle>
            <CardDescription>What was recorded, and for whom.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="User">
              {log.userId ? (
                <Link
                  href={`/app/users/${log.userId}`}
                  className="group/id inline-flex items-center gap-1 font-mono transition-colors hover:text-primary"
                >
                  {log.userId}
                  <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/id:opacity-100 group-focus-visible/id:opacity-100" />
                </Link>
              ) : null}
            </Row>
            <Row label="Channel">{log.channel?.toUpperCase()}</Row>
            <Row label="Code">
              {log.code ? (
                <Copy value={log.code} className="font-mono tracking-widest">
                  {log.code}
                </Copy>
              ) : null}
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Origin</CardTitle>
            <CardDescription>Where the request came from.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Country">
              <Country code={log.country} />
            </Row>
            <Row label="Browser">{agent?.browser}</Row>
            <Row label="OS">{agent?.os}</Row>
            <Row label="Device">{agent?.device}</Row>
            <Row label="User agent">
              {log.userAgent ? (
                <span className="font-mono text-xs break-all">{log.userAgent}</span>
              ) : null}
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recorded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Row label="Time">{formatDateTime(log.createdAt)}</Row>
            <Row label="Log ID">
              <Copy value={String(log.id)} className="font-mono">
                {log.id}
              </Copy>
            </Row>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
