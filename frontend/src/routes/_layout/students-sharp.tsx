import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Search, Upload, MoreVertical } from "lucide-react"
import { useState, useMemo } from "react"

import { getEnrollments, getPrograms, getGroups } from "@/client/custom-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ImportDialog } from "@/components/Common/ImportDialog"
import { importUsersCSV } from "@/client/custom-api"
import { useQueryClient } from "@tanstack/react-query"

export const Route = createFileRoute("/_layout/students-sharp")({
  component: StudentsScreen,
  head: () => ({
    meta: [{ title: "Студенты" }],
  }),
})

// Mock data structure for students
interface StudentRow {
  id: string
  name: string
  initials: string
  group: string
  program: string
  avgScore: number
  progress: number
  status: "active" | "paused" | "graduated" | "dismissed"
  lastActivity: string
}

const MOCK_STUDENTS: StudentRow[] = [
  {
    id: "ST-001",
    name: "Александр Петров",
    initials: "АП",
    group: "БИ-110",
    program: "Информатика",
    avgScore: 9.2,
    progress: 85,
    status: "active",
    lastActivity: "сегодня",
  },
  {
    id: "ST-002",
    name: "Виктория Смирнова",
    initials: "ВС",
    group: "БИ-110",
    program: "Информатика",
    avgScore: 8.7,
    progress: 72,
    status: "active",
    lastActivity: "2ч назад",
  },
  {
    id: "ST-003",
    name: "Дмитрий Козлов",
    initials: "ДК",
    group: "БП-201",
    program: "Право",
    avgScore: 7.5,
    progress: 65,
    status: "active",
    lastActivity: "5ч назад",
  },
  {
    id: "ST-004",
    name: "Елена Волкова",
    initials: "ЕВ",
    group: "БЭ-150",
    program: "Экономика",
    avgScore: 6.8,
    progress: 58,
    status: "paused",
    lastActivity: "3д назад",
  },
  {
    id: "ST-005",
    name: "Сергей Орлов",
    initials: "СО",
    group: "БИ-111",
    program: "Информатика",
    avgScore: 9.5,
    progress: 92,
    status: "active",
    lastActivity: "сегодня",
  },
  {
    id: "ST-006",
    name: "Екатерина Морозова",
    initials: "ЕМ",
    group: "БИ-110",
    program: "Информатика",
    avgScore: 8.3,
    progress: 78,
    status: "active",
    lastActivity: "1ч назад",
  },
  {
    id: "ST-007",
    name: "Николай Федоров",
    initials: "НФ",
    group: "БП-201",
    program: "Право",
    avgScore: 7.1,
    progress: 62,
    status: "active",
    lastActivity: "10ч назад",
  },
  {
    id: "ST-008",
    name: "Мария Киселева",
    initials: "МК",
    group: "БЭ-150",
    program: "Экономика",
    avgScore: 8.9,
    progress: 81,
    status: "active",
    lastActivity: "сегодня",
  },
  {
    id: "ST-009",
    name: "Павел Соколов",
    initials: "ПС",
    group: "БИ-111",
    program: "Информатика",
    avgScore: 6.5,
    progress: 55,
    status: "dismissed",
    lastActivity: "1м назад",
  },
  {
    id: "ST-010",
    name: "Анна Конопцева",
    initials: "АК",
    group: "БЭ-151",
    program: "Экономика",
    avgScore: 9.1,
    progress: 88,
    status: "active",
    lastActivity: "30м назад",
  },
  {
    id: "ST-011",
    name: "Игорь Лебедев",
    initials: "ИЛ",
    group: "БП-202",
    program: "Право",
    avgScore: 7.8,
    progress: 70,
    status: "active",
    lastActivity: "2ч назад",
  },
  {
    id: "ST-012",
    name: "Ольга Васильева",
    initials: "ОВ",
    group: "БИ-110",
    program: "Информатика",
    avgScore: 8.6,
    progress: 77,
    status: "active",
    lastActivity: "3м назад",
  },
]

function getScoreColor(score: number) {
  if (score >= 9) return "text-accent"
  if (score >= 8) return "text-fg"
  if (score >= 7) return "text-mute"
  return "text-neg"
}

function getStatusDot(status: string) {
  switch (status) {
    case "active":
      return "bg-pos"
    case "paused":
      return "bg-accent"
    case "graduated":
      return "bg-pos"
    case "dismissed":
      return "bg-neg"
    default:
      return "bg-mute"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Активен"
    case "paused":
      return "На паузе"
    case "graduated":
      return "Выпущен"
    case "dismissed":
      return "Отчислен"
    default:
      return status
  }
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

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!search) return MOCK_STUDENTS
    const q = search.toLowerCase()
    return MOCK_STUDENTS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.group.toLowerCase().includes(q) ||
        s.program.toLowerCase().includes(q)
    )
  }, [search])

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
          Студенты — <em className="not-italic text-accent font-medium">12 845</em> траекторий.
        </h1>
        <p className="body-md text-mute max-w-2xl">
          Полный список активных учащихся с информацией о прогрессе и статусе.
        </p>
      </div>

      {/* KPI Bar */}
      <div className="px-10">
        <div className="grid grid-cols-6 gap-0 py-6 border-y border-hair">
          <KPIBar value={12845} label="ВСЕГО" />
          <KPIBar value={11204} label="АКТИВНЫЕ" />
          <KPIBar value={1089} label="НА СЕССИИ" />
          <KPIBar value={382} label="ДИПЛОМ" />
          <KPIBar value={143} label="НА КОНТРОЛЕ" />
          <KPIBar value={27} label="ОТЧИСЛЕНЫ" />
        </div>
      </div>

      {/* Table */}
      <div className="px-10 py-12">
        <Card className="border-hair rounded-2xl overflow-hidden p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-hair bg-surface-2">
            <div className="col-span-1 label-sm text-mute">ID</div>
            <div className="col-span-3 label-sm text-mute">СТУДЕНТ</div>
            <div className="col-span-1 label-sm text-mute">ГРУППА</div>
            <div className="col-span-2 label-sm text-mute">ПРОГРАММА</div>
            <div className="col-span-1 label-sm text-mute text-right">БАЛЛ</div>
            <div className="col-span-1 label-sm text-mute">ПРОГРЕСС</div>
            <div className="col-span-1 label-sm text-mute">СТАТУС</div>
            <div className="col-span-1 label-sm text-mute text-right">АКТИВНОСТЬ</div>
            <div className="col-span-1" />
          </div>

          {/* Table Body */}
          {paginatedStudents.map((student, idx) => (
            <div
              key={student.id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${
                idx < paginatedStudents.length - 1 ? "border-b border-hair" : ""
              }`}
            >
              {/* ID */}
              <div className="col-span-1 mono text-sm text-mute">{student.id}</div>

              {/* Student */}
              <div className="col-span-3 flex items-center gap-3">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs font-medium">
                    {student.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="body-sm text-fg truncate">{student.name}</div>
              </div>

              {/* Group */}
              <div className="col-span-1 mono text-sm text-mute">{student.group}</div>

              {/* Program */}
              <div className="col-span-2 body-sm text-mute">{student.program}</div>

              {/* Score */}
              <div className={`col-span-1 mono text-sm font-medium text-right ${getScoreColor(student.avgScore)}`}>
                {student.avgScore}
              </div>

              {/* Progress */}
              <div className="col-span-1">
                <div className="w-full h-1 bg-hair rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1 flex items-center gap-2">
                <span className={`status-dot ${getStatusDot(student.status)}`} />
                <span className="body-xs text-fg">{getStatusLabel(student.status)}</span>
              </div>

              {/* Activity */}
              <div className="col-span-1 body-xs text-mute text-right">{student.lastActivity}</div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-4 h-4 text-mute" />
                </Button>
              </div>
            </div>
          ))}
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
