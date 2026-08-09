import { fetch } from "@/core/server"
import { Screen } from "@/components/ui/screen"
import { DetailSlot } from "@/components/layout/panel"
import { LogsTable } from "./table"
import type { LogEntry } from "@/types"

export default async function LogsLayout({ children }: { children: React.ReactNode }) {
  const logs: LogEntry[] = await fetch("/admin/logs")

  return (
    <>
      <Screen>
        <LogsTable logs={logs} topbar />
      </Screen>
      <DetailSlot basePath="/app/logs" title="Event">
        {children}
      </DetailSlot>
    </>
  )
}
