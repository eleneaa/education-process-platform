import { Filter, Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DashboardLayout,
  DashboardContainer,
  DashboardHeader,
} from "./DashboardLayout"
import { DataTable } from "./DataTable"

interface Student {
  id: string
  name: string
  email: string
  group: string
  status: "active" | "completed" | "pending"
  courses: number
  progress: number
}

const sampleStudents: Student[] = [
  {
    id: "1",
    name: "Иван Петров",
    email: "ivan.petrov@school.ru",
    group: "10-A",
    status: "active",
    courses: 8,
    progress: 85,
  },
  {
    id: "2",
    name: "Мария Иванова",
    email: "maria.ivanova@school.ru",
    group: "10-A",
    status: "active",
    courses: 9,
    progress: 92,
  },
  {
    id: "3",
    name: "Александр Смирнов",
    email: "alex.smirnov@school.ru",
    group: "11-B",
    status: "completed",
    courses: 12,
    progress: 100,
  },
  {
    id: "4",
    name: "Анна Кузнецова",
    email: "anna.kuznetsova@school.ru",
    group: "10-C",
    status: "pending",
    courses: 4,
    progress: 45,
  },
  {
    id: "5",
    name: "Дмитрий Волков",
    email: "dmitry.volkov@school.ru",
    group: "9-D",
    status: "active",
    courses: 6,
    progress: 72,
  },
]

const statusColors = {
  active: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    label: "Активный",
  },
  completed: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    label: "Завершено",
  },
  pending: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    label: "Ожидание",
  },
}

export function StudentsPage() {
  return (
    <DashboardLayout>
      <DashboardContainer>
        <DashboardHeader
          title="Студенты"
          subtitle="Управление списком студентов и отслеживание их прогресса"
          action={
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Фильтр
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Экспорт
              </Button>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Добавить студента
              </Button>
            </div>
          }
        />

        <DataTable<Student>
          title="Все студенты"
          data={sampleStudents}
          searchable
          columns={[
            {
              key: "name",
              label: "Имя",
              width: "180px",
            },
            {
              key: "email",
              label: "Email",
              width: "200px",
            },
            {
              key: "group",
              label: "Группа",
              width: "100px",
            },
            {
              key: "courses",
              label: "Курсов",
              width: "80px",
              align: "center",
            },
            {
              key: "progress",
              label: "Прогресс",
              width: "150px",
              render: (value) => {
                const progress = value as number
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary/30 overflow-hidden max-w-[80px]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress >= 80
                            ? "bg-emerald-500"
                            : progress >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {progress}%
                    </span>
                  </div>
                )
              },
            },
            {
              key: "status",
              label: "Статус",
              width: "120px",
              render: (value) => {
                const status = value as keyof typeof statusColors
                const config = statusColors[status]
                return (
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${config.badge}`}>
                    {config.label}
                  </span>
                )
              },
            },
          ]}
          onRowClick={(student) => {
            console.log("Click student:", student)
          }}
        />
      </DashboardContainer>
    </DashboardLayout>
  )
}
