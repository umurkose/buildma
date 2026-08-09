import { fetch } from "@/core/server"
import type { LogEntry } from "@/types"
import { LogDetail } from "./detail"

export default async function LogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const log: LogEntry | null = await fetch(`/admin/logs/${id}`).catch(() => null)

  if (!log)
    return <p className="p-4 text-sm text-muted-foreground">This event is no longer available.</p>

  return <LogDetail log={log} />
}
