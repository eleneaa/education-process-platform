import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Upload, MoreVertical, Users } from "lucide-react"
import { useState, useMemo } from "react"

import { importUsersCSV, getUsers } from "@/client/custom-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ImportDialog } from "@/components/Common/ImportDialog"
import { EmptyState } from "@/components/Layout"

export const Route = createFileRoute("/_layout/students-sharp")({
  component: StudentsScreen,
  head: () => ({
    meta: [{ title: "Студенты" }],
  }),
})

function getInitials(fullName: string | null): string {
  if (!fullName) return "?"
  const parts = fullName.split(" ")
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2)
}

interface KPIBarProps {
  value: number
  label: string
}

function KPIBar({ value, label }: KPIBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="label-sm">{label}</div>
      <div className="mono text-2xl font-light" style={{ letterSpacing: "-0.04em" }}>
        {value}
      </div>
    </div>
  )
}

function StudentsScreen() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(500),
  })

  const allUsers = usersResponse?.data ?? []
  const students = useMemo(() => {
    return allUsers.filter(u => u.role === "STUDENT")
  }, [allUsers])

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(
      (s) =>
        (s.full_name?.toLowerCase().includes(q)) ||
        (s.email?.toLowerCase().includes(q))
    )
  }, [search, students])

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, filteredStudents.length)

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <div className="divider-h border-b sticky top-0 bg-background z-40">
        <div className="flex items-center justify-between px-10 py-5 gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-mute" />
            <Input
              placeholder="Поиск по имени, ID, группе..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="border-0 bg-transparent text-sm placeholder:text-mute focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <ImportDialog
              trigger={
                <>
                  <Upload className="w-4 h-4" />
                  Импорт
                </>
              }
              title="Импорт студентов"
              description="Загрузите CSV файл со студентами"
              templateColumns={["id", "name", "group", "program"]}
              templateColumnLabels={{
                id: "ID студента",
                name: "Полное имя",
                group: "Группа",
                program: "Программа",
              }}
              templateFilename="students_template.csv"
              onImport={importUsersCSV}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["students"] })}
            />
          </div>
        </div>
      </div>

      {/* Eyebrow */}
      <div className="px-10 py-4">
        <div className="eyebrow">СПИСОК СТУДЕНТОВ</div>
      </div>

      {/* Hero */}
      <div className="px-10 py-8">
        <h1 className="display-hero mb-2">
          Студенты — <em className="not-italic text-accent font-medium">{students.length}</em> активных.
        </h1>
        <p className="body-md text-mute max-w-2xl">
          Полный список студентов с информацией о статусе активности.
        </p>
      </div>

      {/* KPI Bar */}
      <div className="px-10">
        <div className="grid grid-cols-2 gap-0 py-6 border-y border-hair">
          <KPIBar value={students.length} label="ВСЕГО СТУДЕНТОВ" />
          <KPIBar value={students.filter(s => s.is_active).length} label="АКТИВНЫЕ" />
        </div>
      </div>

      {/* Table */}
      <div className="px-10 py-12">
        <Card className="border-hair rounded-2xl overflow-hidden p-0">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-hair bg-surface-2">
            <div className="col-span-2 label-sm text-mute">СТУДЕНТ</div>
            <div className="col-span-2 label-sm text-mute">EMAIL</div>
            <div className="col-span-1 label-sm text-mute">СТАТУС</div>
            <div className="col-span-1" />
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-mute/10 rounded animate-pulse" />
              ))}
            </div>
          ) : paginatedStudents.length > 0 ? (
            <>
              {paginatedStudents.map((student, idx) => (
                <div
                  key={student.id}
                  className={`grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-surface-1 transition-colors ${
                    idx < paginatedStudents.length - 1 ? "border-b border-hair" : ""
                  }`}
                >
                  {/* Student */}
                  <div className="col-span-2 flex items-center gap-3">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs font-medium">
                        {getInitials(student.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="body-sm text-fg truncate">{student.full_name || "—"}</div>
                  </div>

                  {/* Email */}
                  <div className="col-span-2 body-sm text-mute truncate">{student.email}</div>

                  {/* Status */}
                  <div className="col-span-1 flex items-center gap-2">
                    <span className={`status-dot ${student.is_active ? "bg-pos" : "bg-mute"}`} />
                    <span className="body-xs text-fg">{student.is_active ? "Активен" : "Неактивен"}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-4 h-4 text-mute" />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Студентов не найдено"
                description={search ? "Попробуйте изменить поисковый запрос" : "Создайте заявку на поступление, чтобы добавить студента"}
              />
            </div>
          )}
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-8">
          <div className="body-sm text-mute">
            {startIndex} — {endIndex} из {filteredStudents.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              ←
            </Button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-full transition-colors text-sm font-medium ${
                      currentPage === pageNum
                        ? "bg-accent text-white"
                        : "bg-surface-2 text-fg hover:bg-hair"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-mute">…</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-8 w-8 rounded-full transition-colors text-sm font-medium bg-surface-2 text-fg hover:bg-hair"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3"
            >
              →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
