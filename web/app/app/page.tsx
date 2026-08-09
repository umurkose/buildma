import { fetch, me } from "@/core/server"
import { Screen } from "@/components/ui/screen"
import { Overview, type StatsPayload } from "@/components/admin/overview"

const RANGES = [1, 7, 14, 30]

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  await me("admin")
  const { days } = await searchParams
  const window = RANGES.includes(Number(days)) ? Number(days) : 30
  const stats = (await fetch(`/admin/stats?days=${window}`)) as StatsPayload

  return (
    <Screen>
      <Overview stats={stats} />
    </Screen>
  )
}
