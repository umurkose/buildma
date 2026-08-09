"use client"

import type { ColumnDef, User } from "@/types"
import { formatDate } from "@/lib/format"
import { Table } from "@/components/ui/table"

const columns: ColumnDef<User>[] = [
  { accessorKey: "id", header: "ID", meta: { copy: true, mono: true, muted: true } },
  { accessorKey: "email", header: "Email", meta: { copy: true } },
  { accessorKey: "phone", header: "Phone", meta: { copy: true } },
  {
    accessorKey: "name",
    header: "Name",
    meta: { muted: true },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    meta: { muted: true },
    cell: ({ row }) => formatDate(row.getValue("createdAt") as string | undefined),
  },
]

export function UsersTable({ data }: { data: User[] }) {
  return (
    <Table
      columns={columns}
      data={data}
      globalSearch
      searchPlaceholder="Search"
      label="users"
      paginate={false}
      topbar
      rowHref={(user) => `/app/users/${user.id}`}
    />
  )
}
