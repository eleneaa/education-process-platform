import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BookOpen, CheckCircle, Circle, Clock, ChevronDown, X, Search, User, Calendar } from "lucide-react"
import { useState, useMemo } from "react"

import {
  getEnrollments,
  getModules,
  getProgresses,
  getLessons,
} from "@/client/custom-api"
import type { Progress, Module } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/my-programs" as any)({
  component: MyProgramsPage,
  head: () => ({
    meta: [{ title: "Мои программы" }],
  }),
})

const MODULE_TYPE_LABELS: Record<string, string> = {
  theoretical: "Теория",
  practical: "Практика",
  test: "Тест",
}

// ─── Module Content Modal ─────────────────────────────────────────────────────

function ModuleContentModal({
  module,
  isOpen,
  onClose,
}: {
  module: Module | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen || !module) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl mx-4 rounded-2xl max-h-[80vh] overflow-auto">
        <CardHeader className="sticky top-0 flex items-start justify-between gap-4 bg-card/95 backdrop-blur border-b">
          <div className="flex-1">
            <CardTitle className="text-lg">{module.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{MODULE_TYPE_LABELS[module.module_type ?? "theoretical"]}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="pt-6">
          {module.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-2">Описание</h3>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </div>
          )}
          {module.content ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Содержание</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap break-words">
                {module.content}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Содержание модуля еще не добавлено</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Per-program card ─────────────────────────────────────────────────────────

interface ProgramCardProps {
  programId: string
  programTitle: string
  groupName: string
  groupId: string
  progresses: Progress[]
  teacherName?: string | null
}

function ProgramCard({
  programId,
  programTitle,
  groupName,
  groupId,
  progresses,
  teacherName,
}: ProgramCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: modulesData } = useQuery({
    queryKey: ["modules", programId],
    queryFn: () => getModules(programId),
    enabled: !!programId,
    placeholderData: { data: [], count: 0 },
  })

  const { data: lessonsData } = useQuery({
    queryKey: ["lessons", groupId],
    queryFn: () => getLessons(groupId),
    enabled: !!groupId,
    placeholderData: { data: [], count: 0 },
  })

  const modules = (modulesData?.data ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const progressMap = new Map(progresses.map((p) => [p.module_id, p]))

  const completed = modules.filter((m) => progressMap.get(m.id)?.status === "completed").length
  const inProgress = modules.filter((m) => progressMap.get(m.id)?.status === "in_progress").length
  const percentage = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0

  const overallStatus = percentage === 100 ? "completed" : inProgress > 0 || completed > 0 ? "in_progress" : "not_started"

  const lessons = lessonsData?.data ?? []
  const now = new Date()
  const nextLesson = lessons
    .filter((l) => new Date(l.scheduled_at) > now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("ru-RU", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <>
      <Card className="rounded-2xl overflow-hidden backdrop-blur-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex-1">
              <CardTitle className="text-base">{programTitle}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{groupName}</p>
              {teacherName && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{teacherName}</span>
                </div>
              )}
              {nextLesson && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(nextLesson.scheduled_at)}</span>
                </div>
              )}
            </div>
            <Badge variant={overallStatus === "completed" ? "default" : overallStatus === "in_progress" ? "outline" : "secondary"}>
              {overallStatus === "completed" ? "Завершено" : overallStatus === "in_progress" ? "В процессе" : "Не начато"}
            </Badge>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{completed} из {modules.length} модулей</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-1.5">
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Модулей пока нет</p>
            ) : (
              modules.map((m, i) => {
                const status = progressMap.get(m.id)?.status ?? "not_started"
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModule(m)
                      setShowModal(true)
                    }}
                    className={`w-full text-left flex items-center gap-3 rounded-md border px-4 py-2.5 transition-colors hover:bg-accent/50 ${
                      status === "completed" ? "bg-primary/5 border-primary/20" :
                      status === "in_progress" ? "border-[#FF9935]/30 bg-[#FF9935]/5" : "hover:border-border"
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
                  </button>
                )
              })
            )}
          </CardContent>
        )}

        <div className="px-6 py-2 border-t flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
            {isExpanded ? "Скрыть модули" : "Показать модули"}
          </button>
        </div>
      </Card>

      <ModuleContentModal module={selectedModule} isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function MyProgramsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

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

  const enrollmentList = enrollments?.data ?? []

  const filteredEnrollments = useMemo(() => {
    if (!searchQuery.trim()) return enrollmentList
    const query = searchQuery.toLowerCase()
    return enrollmentList.filter((e) =>
      (e.program_title ?? "").toLowerCase().includes(query) ||
      (e.group_name ?? "").toLowerCase().includes(query) ||
      (e.group?.teacher_name ?? "").toLowerCase().includes(query)
    )
  }, [enrollmentList, searchQuery])

  if (isError) return <p className="text-destructive">Ошибка загрузки данных</p>

  return (
    <div className="space-y-8">
      <div className="rounded-3xl overflow-hidden backdrop-blur-xl border border-white/20 bg-gradient-to-br from-white/40 to-white/20 dark:from-slate-800/40 dark:to-slate-900/20 p-8">
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Мои программы
        </h1>
        <p className="text-muted-foreground mt-3">Отслеживайте ваш прогресс обучения</p>
      </div>

      {enrollmentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Вы не записаны ни в одну программу</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Поиск по названию программы, группе или преподавателю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-white/20 backdrop-blur-sm"
            />
          </div>

          {filteredEnrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Программы не найдены</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEnrollments.map((e) => {
                const programId = e.program_id ?? ""
                const programTitle = e.program_title ?? "Программа"
                const groupName = e.group_name ?? e.group?.name ?? "Группа"
                const groupId = e.group_id ?? ""
                const teacherName = e.group?.teacher_name
                return (
                  <ProgramCard
                    key={e.id}
                    programId={programId}
                    programTitle={programTitle}
                    groupName={groupName}
                    groupId={groupId}
                    progresses={progresses}
                    teacherName={teacherName}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
