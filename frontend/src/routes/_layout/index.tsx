import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Search, Bell, Filter } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts"

import { getPrograms, getAdmissionRequests, getGroups, getDashboardStats, getGroupsWithProgress, getLaggingStudents, getTopStudents } from "@/client/custom-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: DashboardSharp,
  head: () => ({
    meta: [{ title: "Обзор" }],
  }),
})

// ─── Components ────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="divider-h border-b sticky top-0 bg-background z-40">
      <div className="flex items-center justify-between px-10 py-5 gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-mute" />
          <Input
            placeholder="⌘K поиск..."
            className="border-0 bg-transparent text-sm placeholder:text-mute focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Eyebrow({ number = "001", title = "ОБЗОР" }) {
  return (
    <div className="flex items-center justify-between text-sm px-10 py-4">
      <div className="eyebrow">
        № {number} — {title}
      </div>
      <div className="eyebrow text-right">
        {new Date().toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  )
}

function HeroSection() {
  const { user } = useAuth()
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(),
  })

  return (
    <div className="px-10 py-8">
      <h1 className="display-hero mb-4">
        Сегодня в системе — <em className="not-italic text-accent font-medium">{stats?.active_students || 0}</em>{" "}
        активных студентов.
      </h1>
      <p className="body-md text-mute max-w-2xl italic">
        Платформа работает стабильно. Все показатели в норме. Последнее обновление сейчас.
      </p>
    </div>
  )
}

interface KPICardProps {
  label: string
  value: string | number
  delta?: string
  deltaType?: "positive" | "negative"
  footer?: string
  sparkline?: number[]
}

function KPICard({ label, value, delta, deltaType, footer, sparkline }: KPICardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="label-sm">{label}</div>
        {delta && (
          <div className={`chip-sharp ${deltaType === "positive" ? "chip-success" : "chip-error"}`}>
            {deltaType === "positive" ? "+" : ""}
            {delta}
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {sparkline && (
        <div className="h-7 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline.map((v, i) => ({ value: v }))} margin={{ top: 2, right: 2, left: 0, bottom: 2 }}>
              <Line type="monotone" dataKey="value" stroke="var(--accent)" dot={false} strokeWidth={1.5} />
              <Tooltip contentStyle={{ display: "none" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {footer && <div className="kpi-footer">{footer}</div>}
    </div>
  )
}

function KPISection() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(),
  })

  if (isLoading || !stats) {
    return (
      <div className="px-10">
        <div className="kpi-grid">
          <div className="h-24 bg-mute/10 rounded animate-pulse" />
          <div className="h-24 bg-mute/10 rounded animate-pulse" />
          <div className="h-24 bg-mute/10 rounded animate-pulse" />
          <div className="h-24 bg-mute/10 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-10">
      <div className="kpi-grid">
        <KPICard
          label="СТУДЕНТЫ"
          value={stats.active_students}
          footer="активных зачисления"
        />
        <KPICard
          label="ПРОГРАММЫ"
          value={stats.active_programs}
          footer="актуальных программ"
        />
        <KPICard
          label="ГРУППЫ"
          value={stats.active_groups}
          footer="активных групп"
        />
        <KPICard
          label="ЗАЯВКИ"
          value={stats.pending_admissions}
          deltaType="negative"
          footer="в ожидании обработки"
        />
      </div>
    </div>
  )
}

function ChartSection() {
  const { data: groupsWithProgress, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups-progress"],
    queryFn: () => getGroupsWithProgress(),
  })

  const { data: topStudents, isLoading: topStudentsLoading } = useQuery({
    queryKey: ["top-students"],
    queryFn: () => getTopStudents(10),
  })

  const { data: laggingStudents, isLoading: laggingLoading } = useQuery({
    queryKey: ["lagging-students"],
    queryFn: () => getLaggingStudents(),
  })

  const topStudentsData = topStudents?.map((s) => ({
    name: s.student_name,
    value: Math.round(s.progress_percentage),
  })) || []

  return (
    <div className="px-10 py-12 space-y-12">
      {/* Top Students */}
      <div className="card-sharp p-6">
        <h3 className="heading-sm mb-6">Топ студентов по успеваемости</h3>
        {topStudentsLoading ? (
          <div className="h-64 bg-mute/10 rounded animate-pulse" />
        ) : topStudentsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topStudentsData} margin={{ top: 5, right: 30, left: 150, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hair)" />
              <XAxis type="number" stroke="var(--mute)" style={{ fontSize: "12px" }} />
              <YAxis dataKey="name" type="category" width={140} stroke="var(--mute)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--hair)" }}
                labelStyle={{ color: "var(--fg)" }}
              />
              <Bar dataKey="value" fill="var(--accent)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-mute">Нет данных о студентах</div>
        )}
      </div>

      {/* Lagging Students */}
      <div className="card-sharp p-6">
        <h3 className="heading-sm mb-6">Студенты с отставанием</h3>
        {laggingLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-mute/10 rounded animate-pulse" />
            ))}
          </div>
        ) : laggingStudents && laggingStudents.length > 0 ? (
          <div className="space-y-2">
            {laggingStudents.map((student) => (
              <div key={student.student_id} className="flex items-center justify-between p-3 border border-hair rounded">
                <div>
                  <div className="font-medium">{student.student_name}</div>
                  <div className="text-sm text-mute">{student.group_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono">{student.progress_percentage.toFixed(0)}%</div>
                  <div className="text-xs text-mute">{student.days_elapsed}/{student.total_days} дней</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-mute">Отстающих студентов не найдено</div>
        )}
      </div>

      {/* Groups Progress */}
      <div className="card-sharp p-6">
        <h3 className="heading-sm mb-6">Прогресс групп</h3>
        {groupsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-mute/10 rounded animate-pulse" />
            ))}
          </div>
        ) : groupsWithProgress && groupsWithProgress.length > 0 ? (
          <div className="space-y-2">
            {groupsWithProgress.map((group) => (
              <div key={group.group_id} className="space-y-2 p-3 border border-hair rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{group.group_name}</div>
                    <div className="text-sm text-mute">{group.program_name} • {group.student_count} студ.</div>
                  </div>
                  <div className="text-sm font-mono">{group.progress_percentage.toFixed(0)}%</div>
                </div>
                <div className="w-full bg-mute/20 rounded h-2">
                  <div
                    className="bg-accent h-2 rounded"
                    style={{ width: `${Math.min(100, group.progress_percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-mute">Активных групп не найдено</div>
        )}
      </div>
    </div>
  )
}

function ActivityFeed() {
  const activities = [
    { time: "14:02", title: "Зачислено новых студентов", detail: "в программу Информатика", tag: "ПРИЁМ", tagType: "accent" },
    { time: "12:45", title: "Завершена проверка заявок", detail: "этап документов", tag: "ДОКУМЕНТ", tagType: "outline" },
    { time: "11:20", title: "Обновлена программа обучения", detail: "Экономика 2024", tag: "ПРОГРАММА", tagType: "outline" },
    { time: "09:15", title: "Отчисление студента", detail: "в связи с неуспеваемостью", tag: "УХОД", tagType: "error" },
    { time: "08:30", title: "Синхронизация с внешней ИС", detail: "завершена успешно", tag: "СИНК", tagType: "success" },
  ]

  return (
    <div className="px-10 py-12">
      <div className="card-sharp p-6">
        <h3 className="heading-sm mb-6">Поток активности</h3>
        <div className="space-y-0">
          {activities.map((activity, i) => (
            <div key={i} className={`py-4 px-4 flex items-start gap-4 ${i > 0 ? "divider-h border-t" : ""}`}>
              <div className="mono text-xs text-mute flex-shrink-0 w-12">{activity.time}</div>
              <div className="flex-1 min-w-0">
                <div className="heading-sm leading-tight">{activity.title}</div>
                <div className="text-sm text-mute">{activity.detail}</div>
              </div>
              <div className={`chip-sharp chip-${activity.tagType} flex-shrink-0`}>{activity.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div className="divider-h border-t mt-12">
      <div className="px-10 py-6 text-xs eyebrow text-center">API Sync · Last update 2 minutes ago
      </div>
    </div>
  )
}

function DashboardSharp() {
  const { user } = useAuth()

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(),
  })

  const { data: admissions } = useQuery({
    queryKey: ["admissions"],
    queryFn: () => getAdmissionRequests({ skip: 0, limit: 10 }),
  })

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroups(),
  })

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Eyebrow />
      <HeroSection />
      <KPISection />
      <ChartSection />
      <ActivityFeed />
      <Footer />
    </div>
  )
}
