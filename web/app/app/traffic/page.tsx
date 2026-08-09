import { fetch, me } from "@/core/server"
import { Screen } from "@/components/ui/screen"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { countryRows, pageRows, RankTable } from "@/components/admin/rank"
import type { StatsPayload } from "@/components/admin/overview"

export default async function TrafficPage() {
  await me("admin")
  const stats = (await fetch("/admin/stats?days=30")) as StatsPayload

  const countryTotal = stats.countries.reduce((sum, row) => sum + row.count, 0)
  const pageTotal = stats.pages.reduce((sum, row) => sum + row.count, 0)

  return (
    <Screen>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Countries</CardTitle>
            <CardDescription>
              {countryTotal.toLocaleString()} visits · {stats.countries.length} countries
            </CardDescription>
          </CardHeader>
          <CardContent className="justify-start p-0">
            <RankTable
              rows={countryRows(stats.countries)}
              total={countryTotal}
              empty="No visits counted yet."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
            <CardDescription>{pageTotal.toLocaleString()} page views</CardDescription>
          </CardHeader>
          <CardContent className="justify-start p-0">
            <RankTable rows={pageRows(stats.pages)} total={pageTotal} empty="No page views counted yet." />
          </CardContent>
        </Card>
      </div>
    </Screen>
  )
}
