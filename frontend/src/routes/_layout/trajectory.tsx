import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ArrowRight, BookOpen, CheckCircle, Circle } from "lucide-react"

import { getEnrollments, getPrograms, getStudentTrajectory } from "@/client/custom-api"
import type { Enrollment, Trajectory } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/trajectory")({
  component: TrajectoryPage,
  beforeLoad: async () => {
    // Students only; admin/teacher redirected away
  },
  head: () => ({
    meta: [{ title: "Моя траектория" }],
  }),
})

function trajectoryStatusLabel(status: string): string {
  const map: Record<string, string> = {
    not_started: "Не начато",
    in_progress: "В процессе",
    completed: "Завершено",
  }
  return map[status] ?? status
}

function trajectoryStatusVariant(
  status: string,
): "default" | "secondary" | "outline" {
  if (status === "completed") return "outline"
  if (status === "in_progress") return "default"
  return "secondary"
}

function actionColor(action: string): string {
  if (action === "Начать") return "text-blue-600"
  if (action === "Продолжить") return "text-orange-600"
  if (action === "Повторить") return "text-green-600"
  return "text-muted-foreground"
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-orange-500 rounded-full transition-all"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

function EnrollmentTrajectory({
  enrollment,
  programTitle,
}: {
  enrollment: Enrollment
  programTitle: string
}) {
  const programId = enrollment.group?.program_id ?? ""
  const studentId = enrollment.student_id

  const { data: trajectory, isError } = useQuery<Trajectory>({
    queryKey: ["trajectory", programId, studentId],
    queryFn: () => getStudentTrajectory(programId, studentId),
    enabled: !!programId && !!studentId,
    placeholderData: {
      status: "not_started",
      percentage: 0,
      recommendations: [],
    },
  })

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{programTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Ошибка загрузки траектории</p>
        </CardContent>
      </Card>
    )
  }

  const traj = trajectory ?? { status: "not_started", percentage: 0, recommendations: [] }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{programTitle}</CardTitle>
          <Badge variant={trajectoryStatusVariant(traj.status)}>
            {trajectoryStatusLabel(traj.status)}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-medium">{traj.percentage}%</span>
          </div>
          <ProgressBar value={traj.percentage} />
        </div>
      </CardHeader>

      {traj.recommendations.length > 0 && (
        <CardContent className="pt-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Рекомендации
          </p>
          <div className="space-y-2">
            {traj.recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.module_id}
                className="flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2"
              >
                <div className="shrink-0">
                  {rec.action === "Повторить" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{rec.title}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium shrink-0 ${actionColor(rec.action)}`}>
                  <span>{rec.action}</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function TrajectoryPage() {
  const { user } = useAuth()

  const { data: enrollments, isError } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => getEnrollments(user!.id),
    enabled: !!user?.id,
    placeholderData: { data: [], count: 0 },
  })
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })

  const programMap = Object.fromEntries(
    (programs?.data ?? []).map((p) => [p.id, p.title]),
  )

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки данных</p>
  }

  const enrollmentList = enrollments?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">
          Моя траектория
        </h1>
        <p className="text-muted-foreground">
          Персональный путь обучения по каждой программе
        </p>
      </div>

      {enrollmentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Вы не записаны ни в одну программу</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {enrollmentList.map((e) => {
            const programId = e.group?.program_id ?? ""
            const title =
              programMap[programId] ??
              e.group?.name ??
              e.group_id
            return (
              <EnrollmentTrajectory
                key={e.id}
                enrollment={e}
                programTitle={title}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
