import { fetch, myId } from "@/core/server"
import { Screen } from "@/components/ui/screen"
import { DetailSlot } from "@/components/layout/panel"
import type { User } from "@/types"
import { UsersTable } from "./table"
import { NewUserForm } from "./form"

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const [users, meId]: [User[], string | null] = await Promise.all([fetch("/admin/users"), myId()])

  const ordered = [...users].sort(
    (a, b) =>
      Number(b.id === meId) - Number(a.id === meId) ||
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  )

  return (
    <>
      <Screen>
        <UsersTable data={ordered} />
        <NewUserForm />
      </Screen>
      <DetailSlot basePath="/app/users" title="Details">
        {children}
      </DetailSlot>
    </>
  )
}
