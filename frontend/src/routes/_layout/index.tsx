import type { ElementType } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Award,
  BookOpen,
  CheckSquare,
  ClipboardList,
  Star,
  Trophy,
  Users,
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
  getPrograms,
  getProgresses,
  getUserAchievements,
  getUserPoints,
} from "@/client/custom-api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Дашборд" }],
  }),
})

// ─── Shared components ────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  color = "text-blue-600",
}: {
  icon: ElementType
  label: string
  value: string | number
  color?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`rounded-full p-3 bg-gray-100 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressBar({
  label,
  value,
  color = "bg-orange-500",
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground truncate max-w-[70%]">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Дашборд</h1>
        <p className="text-muted-foreground">Обзор образовательного процесса</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Users} label="Всего студентов" value={uniqueStudents} color="text-blue-600" />
        <KpiCard icon={BookOpen} label="Активных групп" value={groups?.count ?? 0} color="text-green-600" />
        <KpiCard icon={ClipboardList} label="Новых заявок" value={admissionNew?.count ?? 0} color="text-orange-600" />
        <KpiCard icon={Star} label="Программ" value={programs?.count ?? 0} color="text-purple-600" />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
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
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} name="Заявки" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
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
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Активность"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Programs progress + Recent requests */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
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
                    <TableRow key={req.id}>
                      <TableCell className="text-sm">
                        {req.full_name ?? req.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Дашборд</h1>
        <p className="text-muted-foreground">Управление группами</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={BookOpen} label="Мои группы" value={myGroups.length} color="text-blue-600" />
        <KpiCard icon={Users} label="Студентов в группах" value={totalStudents} color="text-green-600" />
        <KpiCard icon={CheckSquare} label="Ср. прогресс" value="0%" color="text-orange-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Groups progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
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
                    <span className="text-sm font-bold text-orange-500">#{entry.rank}</span>
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

      {/* Groups table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide">
            Мои группы
          </CardTitle>
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
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Нет групп
                  </TableCell>
                </TableRow>
              ) : (
                myGroups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {programMap[g.program_id] ?? g.program_id}
                    </TableCell>
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
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })

  const completedModules = (progresses?.data ?? []).filter(
    (p) => p.status === "completed",
  ).length

  const programMap = Object.fromEntries(
    (programs?.data ?? []).map((p) => [p.id, p.title]),
  )

  // Build per-enrollment label — use group name if available
  const enrollmentRows = (enrollments?.data ?? []).slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Дашборд</h1>
        <p className="text-muted-foreground">Мой прогресс обучения</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={BookOpen} label="Мои программы" value={enrollments?.count ?? 0} color="text-blue-600" />
        <KpiCard icon={CheckSquare} label="Завершено модулей" value={completedModules} color="text-green-600" />
        <KpiCard icon={Star} label="Мои очки" value={points?.points ?? 0} color="text-orange-600" />
        <KpiCard icon={Award} label="Достижений" value={achievements?.count ?? 0} color="text-purple-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Progress per enrollment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Мой прогресс
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrollmentRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет записей</p>
            ) : (
              enrollmentRows.map((e) => {
                const label = e.group?.name ?? programMap[e.group?.program_id ?? ""] ?? e.group_id
                return <ProgressBar key={e.id} label={label} value={0} />
              })
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Мои достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(achievements?.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет достижений</p>
              ) : (
                (achievements?.data ?? []).slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2"
                  >
                    <Trophy className="h-4 w-4 text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      {a.points_required != null && (
                        <p className="text-xs text-muted-foreground">
                          {a.points_required} очков
                        </p>
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
