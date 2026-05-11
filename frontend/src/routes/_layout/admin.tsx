import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { FileDown, Search } from "lucide-react"
import { Suspense, useState, useEffect } from "react"

import { type UserPublic, UsersService } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import { columns, type UserTableData } from "@/components/Admin/columns"
import { DataTable } from "@/components/Common/DataTable"
import { ExportPDFDialog, type ExportColumn } from "@/components/Common/ExportPDFDialog"
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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Администратор",
  admin: "Администратор",
  TEACHER: "Преподаватель",
  teacher: "Преподаватель",
  STUDENT: "Студент",
  student: "Студент",
  SUPERUSER: "Суперпользователь",
}

const USER_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "full_name", label: "ФИО", defaultEnabled: true, format: (v) => (v ? String(v) : "—") },
  { key: "email", label: "Email", defaultEnabled: true },
  {
    key: "role",
    label: "Роль",
    defaultEnabled: true,
    format: (v) => (ROLE_LABELS[String(v)] ?? String(v)),
  },
  {
    key: "is_active",
    label: "Статус",
    defaultEnabled: true,
    format: (v) => (v ? "Активен" : "Неактивен"),
  },
  {
    key: "created_at",
    label: "Дата регистрации",
    defaultEnabled: false,
    format: (v) => (v ? new Date(String(v)).toLocaleDateString("ru-RU") : "—"),
  },
]

function UsersTableContent({
  search,
  roleFilter,
  onFilteredDataChange,
}: {
  search: string
  roleFilter: string
  onFilteredDataChange: (data: UserTableData[]) => void
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

  useEffect(() => {
    onFilteredDataChange(tableData)
  }, [tableData, onFilteredDataChange])

  return <DataTable columns={columns} data={tableData} />
}

function Admin() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [exportOpen, setExportOpen] = useState(false)
  const [exportData, setExportData] = useState<UserTableData[]>([])

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Пользователи
            </h1>
            <p className="text-muted-foreground mt-2">
              Управление учётными записями и назначение ролей
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setExportOpen(true)}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Экспорт PDF
            </Button>
            <AddUser />
          </div>
        </div>
      </div>

      {/* Search + role filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 backdrop-blur-sm border-white/20 bg-white/40 dark:bg-slate-800/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLE_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={roleFilter === f.value ? "default" : "outline"}
              onClick={() => setRoleFilter(f.value)}
              className={roleFilter === f.value ? "bg-primary hover:bg-primary/90" : "border-white/20 hover:bg-white/10"}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-3xl overflow-hidden backdrop-blur-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 p-6">
        <Suspense fallback={<PendingUsers />}>
          <UsersTableContent search={search} roleFilter={roleFilter} onFilteredDataChange={setExportData} />
        </Suspense>
      </div>

      <ExportPDFDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Пользователи"
        columns={USER_EXPORT_COLUMNS}
        data={exportData.map((u) => ({
          ...u,
          role: u.is_superuser ? "SUPERUSER" : (u.role ?? "STUDENT"),
        })) as unknown as Record<string, unknown>[]}
        filename="users"
        exportType="users"
      />
    </div>
  )
}
