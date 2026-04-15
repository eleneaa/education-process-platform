import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense, useState } from "react"

import { type UserPublic, UsersService } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import { columns, type UserTableData } from "@/components/Admin/columns"
import { DataTable } from "@/components/Common/DataTable"
import PendingUsers from "@/components/Pending/PendingUsers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useAuth from "@/hooks/useAuth"

function getUsersQueryOptions() {
  return {
    queryFn: () => UsersService.readUsers({ skip: 0, limit: 100 }),
    queryKey: ["users"],
  }
}

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
  beforeLoad: async () => {
    const user = await UsersService.readUserMe()
    if (!user.is_superuser) {
      throw redirect({ to: "/" })
    }
  },
  head: () => ({
    meta: [{ title: "Пользователи" }],
  }),
})

const ROLE_FILTERS = [
  { value: "all", label: "Все" },
  { value: "student", label: "Студенты" },
  { value: "teacher", label: "Преподаватели" },
  { value: "admin", label: "Администраторы" },
  { value: "superuser", label: "Суперпользователи" },
]

function UsersTableContent({
  search,
  roleFilter,
}: {
  search: string
  roleFilter: string
}) {
  const { user: currentUser } = useAuth()
  const { data: users } = useSuspenseQuery(getUsersQueryOptions())

  const filtered = users.data.filter((user: UserPublic) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      user.email.toLowerCase().includes(q) ||
      (user.full_name ?? "").toLowerCase().includes(q)

    const role = (user.role ?? "student").toLowerCase()
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "superuser" && user.is_superuser) ||
      (!user.is_superuser && role === roleFilter)

    return matchesSearch && matchesRole
  })

  const tableData: UserTableData[] = filtered.map((user: UserPublic) => ({
    ...user,
    isCurrentUser: currentUser?.id === user.id,
  }))

  return <DataTable columns={columns} data={tableData} />
}

function Admin() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Пользователи</h1>
          <p className="text-muted-foreground">Управление учётными записями</p>
        </div>
        <AddUser />
      </div>

      {/* Search + role filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLE_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={roleFilter === f.value ? "default" : "outline"}
              onClick={() => setRoleFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <Suspense fallback={<PendingUsers />}>
        <UsersTableContent search={search} roleFilter={roleFilter} />
      </Suspense>
    </div>
  )
}
