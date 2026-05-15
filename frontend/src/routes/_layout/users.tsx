import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Search, Upload } from "lucide-react"
import { Suspense, useState, useMemo } from "react"

import { type UserPublic, UsersService } from "@/client"
import { importUsersCSV } from "@/client/custom-api"
import AddUser from "@/components/Admin/AddUser"
import { columns, type UserTableData } from "@/components/Admin/columns"
import { DataTable } from "@/components/Common/DataTable"
import { ImportDialog } from "@/components/Common/ImportDialog"
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

export const Route = createFileRoute("/_layout/users")({
  component: UsersPage,
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

  const tableData = useMemo(() => {
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

    return filtered.map((user: UserPublic) => ({
      ...user,
      isCurrentUser: currentUser?.id === user.id,
    })) as UserTableData[]
  }, [users.data, search, roleFilter, currentUser?.id])

  return <DataTable columns={columns} data={tableData} />
}

function UsersPage() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const queryClient = useQueryClient()

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <div className="divider-h border-b sticky top-0 bg-background z-40">
        <div className="flex items-center justify-between px-10 py-5 gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-mute" />
            <Input
              placeholder="Поиск по имени, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent text-sm placeholder:text-mute focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <ImportDialog
              trigger={<><Upload className="h-4 w-4" />Импорт</>}
              title="Импорт пользователей"
              description="Загрузите CSV файл с пользователями"
              templateColumns={["email", "full_name", "role", "password"]}
              templateColumnLabels={{
                email: "Email",
                full_name: "Полное имя",
                role: "Роль (STUDENT/TEACHER/ADMIN)",
                password: "Пароль (опционально)",
              }}
              templateFilename="users_template.csv"
              onImport={importUsersCSV}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["users"] })}
            />
            <AddUser />
          </div>
        </div>
      </div>

      {/* Eyebrow */}
      <div className="px-10 py-4">
        <div className="eyebrow">УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ</div>
      </div>

      {/* Hero */}
      <div className="px-10 py-8">
        <h1 className="display-hero mb-2">Пользователи</h1>
        <p className="body-md text-mute max-w-2xl">Управление учётными записями и назначение ролей</p>
      </div>

      {/* Role Filters */}
      <div className="px-10 py-6 border-b border-hair">
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

      {/* Table Container */}
      <div className="px-10 py-12">
        <Suspense fallback={<PendingUsers />}>
          <UsersTableContent search={search} roleFilter={roleFilter} />
        </Suspense>
      </div>
    </div>
  )
}
