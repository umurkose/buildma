import { fetch } from "@/core/server"
import type { ExportRow } from "@/types"
import type { StatsPayload } from "@/components/admin/overview"
import { Screen } from "@/components/ui/screen"
import { DetailSlot } from "@/components/layout/panel"
import { DownloadsTable } from "./table"

export default async function DownloadsLayout({ children }: { children: React.ReactNode }) {
  const [rows, stats] = (await Promise.all([
    fetch("/admin/exports"),
    fetch("/admin/stats?days=30"),
  ])) as [ExportRow[], StatsPayload]

  return (
    <>
      <Screen>
        <DownloadsTable
          rows={rows}
          downloads={stats.totals.download ?? 0}
          copies={stats.totals.copy ?? 0}
        />
      </Screen>
      <DetailSlot basePath="/app/downloads" title="Email">
        {children}
      </DetailSlot>
    </>
  )
}
