import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import {
  Award,
  BookOpen,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Star,
  Trophy,
  Users,
  Activity,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  getAdmissionRequests,
  getEnrollments,
  getGroupLeaderboard,
  getGroups,
  getLessons,
  getPrograms,
  getProgresses,
  getUserAchievements,
  getUserPoints,
} from "@/client/custom-api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MetricCard } from "@/components/Dashboard"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/index/old")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Дашборд" }],
  }),
})

// ─── Shared components ────────────────────────────────────────────────────────

function ProgressBar({
  label,
  value,
  color = "bg-gradient-to-r from-amber-500 to-orange-500",
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground/80 truncate max-w-[70%] font-medium">{label}</span>
        <span className="text-sm font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{value}%</span>
      </div>
      <div className="h-2.5 w-full bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-lg`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    new: { label: "Новая", variant: "secondary" },
    in_review: { label: "В рассмотрении", variant: "default" },
    approved: { label: "Одобрено", variant: "outline" },
    rejected: { label: "Отклонено", variant: "destructive" },
  }
  const item = map[status] ?? { label: status, variant: "secondary" }
  return <Badge variant={item.variant}>{item.label}</Badge>
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ userId: _userId }: { userId: string }) {
  const navigate = useNavigate()

  const { data: admissionAll } = useQuery({
    queryKey: ["admission-requests"],
    queryFn: () => getAdmissionRequests(),
    placeholderData: { data: [], count: 0 },
  })
  const { data: admissionNew } = useQuery({
    queryKey: ["admission-requests", "new"],
    queryFn: () => getAdmissionRequests("new"),
    placeholderData: { data: [], count: 0 },
  })
  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    placeholderData: { data: [], count: 0 },
  })
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })
  const { data: enrollments } = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => getEnrollments(),
    placeholderData: { data: [], count: 0 },
  })

  const allRequests = admissionAll?.data ?? []
  const statusCounts = {
    new: allRequests.filter((r) => r.status === "new").length,
    in_review: allRequests.filter((r) => r.status === "in_review").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
  }

  const barData = [
    { name: "Новые", count: statusCounts.new },
    { name: "В процессе", count: statusCounts.in_review },
    { name: "Одобрено", count: statusCounts.approved },
    { name: "Отклонено", count: statusCounts.rejected },
  ]

  const lineData = [
    { month: "Янв", value: 0 },
    { month: "Фев", value: 0 },
    { month: "Мар", value: 0 },
    { month: "Апр", value: 0 },
    { month: "Май", value: 0 },
    { month: "Июн", value: 0 },
  ]

  const uniqueStudents = new Set((enrollments?.data ?? []).map((e) => e.student_id)).size
  const recentRequests = allRequests.slice(0, 5)

  return (
    <div className="flex flex-col h-full gap-8 p-6 md:p-8 relative">
      {/* Animated gradient background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-bl from-emerald-500/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-gradient-to-tr from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10">
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">Дашборд</h1>
        <p className="text-muted-foreground/70 mt-3 text-lg">Обзор образовательного процесса</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Всего студентов"
          value={uniqueStudents}
          variant="success"
          onClick={() => navigate({ to: "/users" })}
        />
        <MetricCard
          icon={BookOpen}
          label="Активных групп"
          value={groups?.count ?? 0}
          onClick={() => navigate({ to: "/groups" })}
        />
        <MetricCard
          icon={ClipboardList}
          label="Новых заявок"
          value={admissionNew?.count ?? 0}
          onClick={() => navigate({ to: "/admission-requests" })}
        />
        <MetricCard
          icon={Activity}
          label="Программ"
          value={programs?.count ?? 0}
          variant="default"
          onClick={() => navigate({ to: "/programs" })}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="backdrop-blur-xl border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Заявки по статусам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Заявки" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Активность по месяцам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#10B981" }}
                  name="Активность"
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Programs progress + Recent requests */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="backdrop-blur-xl border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Программы — прогресс
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(programs?.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет программ</p>
            ) : (
              (programs?.data ?? []).slice(0, 5).map((p) => (
                <ProgressBar key={p.id} label={p.title} value={0} />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Последние заявки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Нет заявок
                    </TableCell>
                  </TableRow>
                ) : (
                  recentRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors">
                      <TableCell className="text-sm font-medium text-foreground">
                        {req.full_name ?? req.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground/70">
                        {req.created_at
                          ? new Date(req.created_at).toLocaleDateString("ru-RU")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Teacher Dashboard ────────────────────────────────────────────────────────

function TeacherDashboard({ userId }: { userId: string }) {
  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    placeholderData: { data: [], count: 0 },
  })
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })
  const { data: teacherLessons } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => getLessons(),
    placeholderData: { data: [], count: 0 },
  })

  const myGroups = (groups?.data ?? []).filter(
    (g) => g.teacher_id === userId,
  )

  const totalStudents = myGroups.reduce((s, g) => s + (g.student_count ?? 0), 0)

  const firstGroupId = myGroups[0]?.id
  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard", firstGroupId],
    queryFn: () => getGroupLeaderboard(firstGroupId!),
    enabled: !!firstGroupId,
    placeholderData: { group_id: "", entries: [] },
  })

  const programMap = Object.fromEntries(
    (programs?.data ?? []).map((p) => [p.id, p.title]),
  )

  return (
    <div className="flex flex-col h-full gap-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Дашборд</h1>
        <p className="text-muted-foreground mt-2">Управление группами и прогресс студентов</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={BookOpen}
          label="Мои группы"
          value={myGroups.length}
          variant="default"
        />
        <MetricCard
          icon={Users}
          label="Студентов в группах"
          value={totalStudents}
          variant="success"
        />
        <MetricCard
          icon={CheckSquare}
          label="Ср. прогресс"
          value="0%"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Groups progress */}
        <Card className="backdrop-blur-xl border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Прогресс групп
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет групп</p>
            ) : (
              myGroups.map((g) => (
                <ProgressBar key={g.id} label={g.name} value={0} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="backdrop-blur-xl border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Топ студентов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(leaderboard?.entries ?? []).slice(0, 5).map((entry) => (
                <div
                  key={entry.student_id}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#FF9935]">#{entry.rank}</span>
                    <span className="text-sm">
                      {entry.full_name ?? entry.email ?? entry.student_id}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{entry.points} очков</span>
                </div>
              ))}
              {(leaderboard?.entries ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendar for teacher */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Расписание</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniCalendar events={[
              ...(teacherLessons?.data ?? []).map((l) => ({
                date: new Date(l.scheduled_at),
                label: l.title,
                color: "#FF9935",
              })),
              ...myGroups.flatMap((g, i) => {
                const colors = ["#3E6E85", "#9CCCE8", "#EE6C55"]
                const color = colors[i % colors.length]
                const evts = []
                if (g.start_date) evts.push({ date: new Date(g.start_date), label: `Начало: ${g.name}`, color })
                if (g.end_date) evts.push({ date: new Date(g.end_date), label: `Конец: ${g.name}`, color })
                return evts
              }),
            ]} />
          </CardContent>
        </Card>

        {/* Groups table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">Мои группы</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Программа</TableHead>
                  <TableHead>Студентов</TableHead>
                  <TableHead>Прогресс</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Нет групп</TableCell>
                  </TableRow>
                ) : (
                  myGroups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{programMap[g.program_id] ?? g.program_id}</TableCell>
                      <TableCell>{g.student_count ?? 0}</TableCell>
                      <TableCell>0%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const MONTHS_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"]
const DAYS_RU = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"]

interface CalendarEvent {
  date: Date
  label: string
  color: string
}

function MiniCalendar({ events = [] }: { events?: CalendarEvent[] }) {
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = current.getFullYear()
  const month = current.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Monday-based weekday (0=Mon, 6=Sun)
  const firstDayRaw = new Date(year, month, 1).getDay()
  const firstDay = (firstDayRaw + 6) % 7

  const eventMap = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = `${ev.date.getFullYear()}-${ev.date.getMonth()}-${ev.date.getDate()}`
    if (!eventMap.has(key)) eventMap.set(key, [])
    eventMap.get(key)!.push(ev)
  }

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{MONTHS_RU[month]} {year}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setCurrent(new Date(year, month - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setCurrent(new Date(year, month + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {DAYS_RU.map((d) => (
          <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const key = `${year}-${month}-${day}`
          const dayEvents = eventMap.get(key) ?? []
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={`h-7 w-7 flex items-center justify-center rounded-full text-sm transition-colors
                ${isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"}
              `}>
                {day}
              </div>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5">
                  {dayEvents.slice(0, 3).map((ev, j) => (
                    <div key={j} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ev.color }} title={ev.label} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {events.length > 0 && (
        <div className="border-t pt-3 space-y-1.5">
          {events
            .filter(ev => ev.date.getMonth() === month && ev.date.getFullYear() === year)
            .slice(0, 4)
            .map((ev, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                <span className="text-muted-foreground">
                  {ev.date.getDate()} {MONTHS_RU[ev.date.getMonth()].slice(0, 3).toLowerCase()} — {ev.label}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

function StudentDashboard({ userId }: { userId: string }) {
  const { data: enrollments } = useQuery({
    queryKey: ["enrollments", userId],
    queryFn: () => getEnrollments(userId),
    placeholderData: { data: [], count: 0 },
  })
  const { data: progresses } = useQuery({
    queryKey: ["progresses", userId],
    queryFn: () => getProgresses(userId),
    placeholderData: { data: [], count: 0 },
  })
  const { data: points } = useQuery({
    queryKey: ["user-points", userId],
    queryFn: () => getUserPoints(userId),
    placeholderData: { user_id: userId, points: 0 },
  })
  const { data: achievements } = useQuery({
    queryKey: ["user-achievements", userId],
    queryFn: () => getUserAchievements(userId),
    placeholderData: { data: [], count: 0 },
  })
  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    placeholderData: { data: [], count: 0 },
  })
  const { data: lessonsData } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => getLessons(),
    placeholderData: { data: [], count: 0 },
  })

  const completedModules = (progresses?.data ?? []).filter((p) => p.status === "completed").length
  const inProgressModules = (progresses?.data ?? []).filter((p) => p.status === "in_progress").length

  // My enrolled groups
  const enrolledGroupIds = new Set((enrollments?.data ?? []).map((e) => e.group_id))
  const myGroups = (groups?.data ?? []).filter((g) => enrolledGroupIds.has(g.id))

  // Build calendar events — lessons + group dates
  const calendarEvents: CalendarEvent[] = []
  const GROUP_COLORS = ["#3E6E85", "#FF9935", "#9CCCE8", "#EE6C55"]

  // Lessons (orange)
  ;(lessonsData?.data ?? []).forEach((l) => {
    calendarEvents.push({ date: new Date(l.scheduled_at), label: l.title, color: "#FF9935" })
  })

  // Group start/end dates
  myGroups.forEach((g, i) => {
    const color = GROUP_COLORS[(i + 1) % GROUP_COLORS.length]
    if (g.start_date) calendarEvents.push({ date: new Date(g.start_date), label: `Начало: ${g.name}`, color })
    if (g.end_date) calendarEvents.push({ date: new Date(g.end_date), label: `Конец: ${g.name}`, color })
  })

  // Upcoming lessons (next 5)
  const today = new Date()
  const upcomingLessons = (lessonsData?.data ?? [])
    .filter((l) => new Date(l.scheduled_at) >= today)
    .slice(0, 5)

  return (
    <div className="flex flex-col h-full gap-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Дашборд</h1>
        <p className="text-muted-foreground mt-2">Мой прогресс обучения и достижения</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={BookOpen}
          label="Мои группы"
          value={myGroups.length}
          variant="default"
        />
        <MetricCard
          icon={CheckSquare}
          label="Завершено модулей"
          value={completedModules}
          variant="success"
        />
        <MetricCard
          icon={Star}
          label="Мои очки"
          value={points?.points ?? 0}
          variant="warning"
        />
        <MetricCard
          icon={Award}
          label="Достижений"
          value={achievements?.count ?? 0}
          variant="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Расписание
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniCalendar events={calendarEvents} />
          </CardContent>
        </Card>

        {/* Upcoming lessons */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Ближайшие занятия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет предстоящих занятий</p>
            ) : (
              upcomingLessons.map((l) => {
                const dt = new Date(l.scheduled_at)
                const myGroup = myGroups.find((g) => g.id === l.group_id)
                return (
                  <div key={l.id} className="flex gap-3 rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex flex-col items-center justify-center w-10 shrink-0 text-center">
                      <span className="text-lg font-bold leading-none text-primary">{dt.getDate()}</span>
                      <span className="text-xs text-muted-foreground">{MONTHS_RU[dt.getMonth()].slice(0, 3)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} · {l.duration_minutes} мин
                        {myGroup ? ` · ${myGroup.name}` : ""}
                        {l.location ? ` · ${l.location}` : ""}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* My groups progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Мои группы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет записей</p>
            ) : (
              myGroups.map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate max-w-[70%]">{g.name}</span>
                    <Badge variant="outline" className="text-xs">{
                      g.status === "active" ? "Активна" :
                      g.status === "planned" ? "Скоро" :
                      g.status === "finished" ? "Завершена" : g.status
                    }</Badge>
                  </div>
                  {g.start_date && g.end_date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(g.start_date).toLocaleDateString("ru-RU")} — {new Date(g.end_date).toLocaleDateString("ru-RU")}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Achievements & progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Points progress */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-md bg-muted">
              <Star className="h-5 w-5 text-[#FF9935] shrink-0" />
              <div>
                <p className="text-lg font-bold">{points?.points ?? 0} очков</p>
                <p className="text-xs text-muted-foreground">{completedModules} завершено · {inProgressModules} в процессе</p>
              </div>
            </div>
            <div className="space-y-2">
              {(achievements?.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет достижений</p>
              ) : (
                (achievements?.data ?? []).slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <Trophy className="h-4 w-4 text-[#FF9935] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      {a.points_required != null && (
                        <p className="text-xs text-muted-foreground">{a.points_required} очков</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  const role = (user.role ?? "student").toLowerCase()

  if (role === "admin" || user.is_superuser) {
    return <AdminDashboard userId={user.id} />
  }
  if (role === "teacher") {
    return <TeacherDashboard userId={user.id} />
  }
  return <StudentDashboard userId={user.id} />
}
