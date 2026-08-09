import { fetch } from "@/core/server"
import type { ExportRow } from "@/types"
import { ExportPreview } from "./preview"

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row: ExportRow | null = await fetch(`/admin/exports/${id}`).catch(() => null)

  if (!row?.html)
    return <p className="p-4 text-sm text-muted-foreground">This email is no longer available.</p>

  return <ExportPreview row={row} />
}
