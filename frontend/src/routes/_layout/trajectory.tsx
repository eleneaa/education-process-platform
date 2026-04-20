import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BookOpen, CheckCircle, Circle, Clock } from "lucide-react"

import {
  getEnrollments,
  getModules,
  getProgresses,
} from "@/client/custom-api"
import type { Progress } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/trajectory")({
  component: TrajectoryPage,
  head: () => ({
    meta: [{ title: "Моя траектория" }],
  }),
})

const MODULE_TYPE_LABELS: Record<string, string> = {
  theoretical: "Теория",
  practical: "Практика",
  test: "Тест",
}

// ─── Per-program trajectory ───────────────────────────────────────────────────

function ProgramTrajectory({
  programId,
  programTitle,
  groupName,
  progresses,
}: {
  programId: string
  programTitle: string
  groupName: string
  progresses: Progress[]
}) {
  const { data: modulesData } = useQuery({
    queryKey: ["modules", programId],
    queryFn: () => getModules(programId),
    enabled: !!programId,
    placeholderData: { data: [], count: 0 },
  })

  const modules = (modulesData?.data ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const progressMap = new Map(progresses.map((p) => [p.module_id, p]))

  const completed = modules.filter((m) => progressMap.get(m.id)?.status === "completed").length
  const inProgress = modules.filter((m) => progressMap.get(m.id)?.status === "in_progress").length
  const percentage = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0

  const overallStatus = percentage === 100 ? "completed" : inProgress > 0 || completed > 0 ? "in_progress" : "not_started"

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">{programTitle}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{groupName}</p>
          </div>
          <Badge variant={overallStatus === "completed" ? "default" : overallStatus === "in_progress" ? "outline" : "secondary"}>
            {overallStatus === "completed" ? "Завершено" : overallStatus === "in_progress" ? "В процессе" : "Не начато"}
          </Badge>
        </div>

        <div className="space-y-1 mt-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{completed} из {modules.length} модулей</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-1.5">
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Модулей пока нет</p>
        ) : (
          modules.map((m, i) => {
            const status = progressMap.get(m.id)?.status ?? "not_started"
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded-md border px-4 py-2.5 ${
                  status === "completed" ? "bg-primary/5 border-primary/20" :
                  status === "in_progress" ? "border-[#FF9935]/30 bg-[#FF9935]/5" : ""
                }`}
              >
                <span className="text-muted-foreground text-xs w-5 shrink-0 text-right">{i + 1}</span>
                <div className="shrink-0">
                  {status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : status === "in_progress" ? (
                    <Clock className="h-4 w-4 text-[#FF9935]" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${status === "completed" ? "text-muted-foreground line-through" : "font-medium"}`}>
                    {m.title}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{MODULE_TYPE_LABELS[m.module_type ?? "theoretical"]}</span>
                {status === "completed" && (
                  <span className="text-xs text-primary font-medium shrink-0">✓</span>
                )}
                {status === "in_progress" && (
                  <span className="text-xs text-[#FF9935] font-medium shrink-0">...</span>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function TrajectoryPage() {
  const { user } = useAuth()

  const { data: enrollments, isError } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => getEnrollments(user!.id),
    enabled: !!user?.id,
    placeholderData: { data: [], count: 0 },
    staleTime: 0,
    gcTime: 0,
  })
  const { data: progressesData } = useQuery({
    queryKey: ["progresses", user?.id],
    queryFn: () => getProgresses(user!.id),
    enabled: !!user?.id,
    placeholderData: { data: [], count: 0 },
  })

  const progresses = progressesData?.data ?? []

  if (isError) return <p className="text-destructive">Ошибка загрузки данных</p>

  const enrollmentList = enrollments?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Моя траектория</h1>
        <p className="text-muted-foreground">Прогресс обучения по программам</p>
      </div>

      {enrollmentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Вы не записаны ни в одну программу</p>
        </div>
      ) : (
        <div className="space-y-6">
          {enrollmentList.map((e) => {
            const programId = e.program_id ?? ""
            const programTitle = e.program_title ?? "Программа"
            const groupName = e.group_name ?? e.group?.name ?? "Группа"
            return (
              <ProgramTrajectory
                key={e.id}
                programId={programId}
                programTitle={programTitle}
                groupName={groupName}
                progresses={progresses}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
