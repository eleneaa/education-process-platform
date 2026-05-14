import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, CalendarDays, ClipboardList, GraduationCap, Pencil, Plus, Trash2, Users } from "lucide-react"
import { useState } from "react"

import { createLesson, createModule, createProgress, createRecurringLessons, deleteLesson, deleteModule, getLessons, getEnrollments, getGroups, getModules, getProgresses, getPrograms, updateLesson, updateModule, updateProgress, updateProgram } from "@/client/custom-api"
import type { Lesson, Progress } from "@/client/custom-types"
import type { Module, Program } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/programs/$programId")({
  component: ProgramDetailPage,
  head: () => ({
    meta: [{ title: "Программа" }],
  }),
})

const MODULE_TYPE_LABELS: Record<string, string> = {
  theoretical: "Теоретический",
  practical: "Практический",
  test: "Тестовый",
}
const MODULE_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  theoretical: "default",
  practical: "outline",
  test: "secondary",
}
const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  on_review: "На проверке",
  approved: "Одобрена",
  rejected: "Отклонена",
}
const GROUP_STATUS_LABELS: Record<string, string> = {
  planned: "Запланирована",
  active: "Активна",
  finished: "Завершена",
  canceled: "Отменена",
}
function statusVariant(s?: string | null): "default" | "secondary" | "outline" | "destructive" {
  if (s === "approved" || s === "active") return "default"
  if (s === "on_review" || s === "planned") return "outline"
  if (s === "rejected" || s === "canceled") return "destructive"
  return "secondary"
}

// ─── Edit Program Dialog ──────────────────────────────────────────────────────

function EditProgramDialog({
  open, onOpenChange, program,
}: { open: boolean; onOpenChange: (v: boolean) => void; program: Program }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [title, setTitle] = useState(program.title)
  const [description, setDescription] = useState(program.description ?? "")
  const [status, setStatus] = useState(program.status ?? "draft")

  const mutation = useMutation({
    mutationFn: () => updateProgram(program.id, { title: title.trim(), description: description.trim() || null, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа обновлена")
      onOpenChange(false)
    },
    onError: () => showErrorToast("Не удалось сохранить"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Редактировать программу</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Название *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="on_review">На проверке</SelectItem>
                <SelectItem value="approved">Одобрена</SelectItem>
                <SelectItem value="rejected">Отклонена</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Module Form Dialog ───────────────────────────────────────────────────────

function ModuleFormDialog({
  open, onOpenChange, programId, module, nextPosition,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  programId: string; module?: Module; nextPosition: number
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const isEdit = !!module
  const [title, setTitle] = useState(module?.title ?? "")
  const [description, setDescription] = useState(module?.description ?? "")
  const [moduleType, setModuleType] = useState<string>(module?.module_type ?? "theoretical")
  const [content, setContent] = useState(module?.content ?? "")

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? updateModule(module!.id, { title: title.trim(), description: description.trim() || null, module_type: moduleType, content: content.trim() || null })
        : createModule({ title: title.trim(), description: description.trim() || null, program_id: programId, position: nextPosition, module_type: moduleType, content: content.trim() || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", programId] })
      showSuccessToast(isEdit ? "Модуль обновлён" : "Модуль добавлен")
      onOpenChange(false)
    },
    onError: () => showErrorToast("Не удалось сохранить модуль"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Редактировать модуль" : "Добавить модуль"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) mutation.mutate() }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Название *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Тип</Label>
              <Select value={moduleType} onValueChange={setModuleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="theoretical">Теоретический</SelectItem>
                  <SelectItem value="practical">Практический</SelectItem>
                  <SelectItem value="test">Тестовый</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Краткое описание" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Учебные материалы</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Текст учебного материала..."
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Сохранение..." : isEdit ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Inline-editable lesson row ───────────────────────────────────────────────

function LessonRow({
  lesson,
  onDeleted,
}: {
  lesson: Lesson
  onDeleted: () => void
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(lesson.title)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () => updateLesson(lesson.id, { title: title.trim() || lesson.title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lesson.group_id] })
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      setEditing(false)
      showSuccessToast("Тема обновлена")
    },
    onError: () => { showErrorToast("Ошибка"); setTitle(lesson.title) },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteLesson(lesson.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lesson.group_id] })
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      onDeleted()
      showSuccessToast("Занятие удалено")
    },
    onError: () => showErrorToast("Ошибка"),
  })

  const dt = new Date(lesson.scheduled_at)

  return (
    <>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Удалить занятие?"
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
      />
      <div className="group flex items-center gap-3 rounded-md border px-3 py-2.5 hover:border-primary/30 transition-colors">
        {/* Date block */}
        <div className="flex flex-col items-center w-10 shrink-0 text-center">
          <span className="text-base font-bold leading-none text-primary">{dt.getDate()}</span>
          <span className="text-xs text-muted-foreground">
            {dt.toLocaleDateString("ru-RU", { month: "short" })}
          </span>
          <span className="text-xs text-muted-foreground">
            {dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Title — inline edit on click */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              className="w-full text-sm font-medium bg-transparent border-b border-primary outline-none pb-0.5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => { if (title.trim() !== lesson.title) updateMutation.mutate(); else setEditing(false) }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { if (title.trim() !== lesson.title) updateMutation.mutate(); else setEditing(false) }
                if (e.key === "Escape") { setTitle(lesson.title); setEditing(false) }
              }}
            />
          ) : (
            <p
              className="text-sm font-medium cursor-pointer hover:text-primary truncate"
              onClick={() => setEditing(true)}
              title="Нажмите для редактирования темы"
            >
              {lesson.title}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {lesson.duration_minutes} мин
            {lesson.location ? ` · ${lesson.location}` : ""}
            {lesson.series_id && <span className="ml-1 text-primary/70">· серия</span>}
          </p>
        </div>

        {/* Delete */}
        <Button
          size="sm" variant="ghost"
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </>
  )
}

// ─── Schedule Sheet ──────────────────────────────────────────────────────────

// ─── Progress Journal Sheet ───────────────────────────────────────────────────

function ProgressJournalSheet({
  open, onOpenChange, groupId, groupName, programId,
}: { open: boolean; onOpenChange: (v: boolean) => void; groupId: string; groupName: string; programId: string }) {
  const queryClient = useQueryClient()
  const { showErrorToast } = useCustomToast()

  const { data: modulesData } = useQuery({
    queryKey: ["modules", programId],
    queryFn: () => getModules(programId),
    enabled: open && !!programId,
    placeholderData: { data: [], count: 0 },
  })
  const { data: enrollmentsData } = useQuery({
    queryKey: ["enrollments", "group", groupId],
    queryFn: () => getEnrollments(undefined, groupId),
    enabled: open,
    placeholderData: { data: [], count: 0 },
  })

  // Fetch all progresses for all students in the group
  const studentIds = (enrollmentsData?.data ?? []).map((e) => e.student_id)
  const progressQueries = useQuery({
    queryKey: ["progresses-group", groupId, studentIds.join(",")],
    queryFn: async () => {
      const all: Progress[] = []
      for (const sid of studentIds) {
        const res = await getProgresses(sid)
        all.push(...res.data)
      }
      return all
    },
    enabled: open && studentIds.length > 0,
    placeholderData: [] as Progress[],
  })

  const modules = (modulesData?.data ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const students = enrollmentsData?.data ?? []
  const progresses: Progress[] = Array.isArray(progressQueries.data) ? progressQueries.data : []

  const progressMap = new Map<string, Map<string, Progress>>()
  for (const p of progresses) {
    if (!progressMap.has(p.student_id)) progressMap.set(p.student_id, new Map())
    progressMap.get(p.student_id)!.set(p.module_id, p)
  }

  const toggleProgress = useMutation({
    mutationFn: async ({ studentId, moduleId }: { studentId: string; moduleId: string }) => {
      const existing = progressMap.get(studentId)?.get(moduleId)
      if (existing?.status === "completed") {
        return updateProgress(existing.id, { status: "in_progress" })
      } else if (existing) {
        return updateProgress(existing.id, { status: "completed" })
      } else {
        return createProgress({ student_id: studentId, module_id: moduleId, status: "completed" })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresses-group", groupId] })
      queryClient.invalidateQueries({ queryKey: ["progresses"] })
      queryClient.invalidateQueries({ queryKey: ["user-points"] })
    },
    onError: () => showErrorToast("Ошибка обновления прогресса"),
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Журнал прогресса — {groupName}
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Отмечайте пройденные модули. За каждый завершённый студент получает 10 очков.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">В группе нет студентов</p>
          ) : modules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">В программе нет модулей</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-6 font-semibold min-w-[160px]">Студент</th>
                  {modules.map((m, i) => (
                    <th key={m.id} className="py-2 px-2 text-center min-w-[56px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-normal text-muted-foreground">{i + 1}</span>
                        <span className="text-xs font-medium max-w-[60px] truncate" title={m.title}>
                          {m.title.length > 8 ? m.title.slice(0, 8) + "…" : m.title}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-2 pl-4 text-center font-semibold min-w-[48px]">%</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const sp = progressMap.get(s.student_id) ?? new Map()
                  const done = modules.filter((m) => sp.get(m.id)?.status === "completed").length
                  const pct = modules.length > 0 ? Math.round((done / modules.length) * 100) : 0
                  return (
                    <tr key={s.student_id} className="border-b hover:bg-muted/20">
                      <td className="py-2.5 pr-6">
                        <p className="font-medium truncate max-w-[160px]">
                          {s.student_name ?? s.student_email ?? s.student_id}
                        </p>
                      </td>
                      {modules.map((m) => {
                        const p = sp.get(m.id)
                        const isDone = p?.status === "completed"
                        const isInProgress = p?.status === "in_progress"
                        return (
                          <td key={m.id} className="py-2.5 px-2 text-center">
                            <button
                              className={`w-8 h-8 rounded-md border-2 transition-all mx-auto flex items-center justify-center text-sm font-bold ${
                                isDone ? "bg-primary border-primary text-white" :
                                isInProgress ? "bg-[#FF9935]/20 border-[#FF9935] text-[#FF9935]" :
                                "border-border hover:border-primary/50"
                              }`}
                              onClick={() => toggleProgress.mutate({ studentId: s.student_id, moduleId: m.id })}
                              disabled={toggleProgress.isPending}
                              title={isDone ? "Завершён — нажмите чтобы отменить" : "Отметить завершённым"}
                            >
                              {isDone ? "✓" : isInProgress ? "~" : ""}
                            </button>
                          </td>
                        )
                      })}
                      <td className="py-2.5 pl-4 text-center">
                        <span className={`text-sm font-semibold ${pct === 100 ? "text-primary" : pct > 0 ? "text-[#FF9935]" : "text-muted-foreground"}`}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t px-6 py-3 shrink-0 bg-muted/20 flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">✓</div>
            <span>Завершён (+10 оч.)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-[#FF9935] bg-[#FF9935]/10 flex items-center justify-center text-[#FF9935] text-xs">~</div>
            <span>В процессе</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded border-2 border-border" />
            <span>Не начато</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function ScheduleDialog({
  open, onOpenChange, groupId, groupName,
}: { open: boolean; onOpenChange: (v: boolean) => void; groupId: string; groupName: string }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [isRecurring, setIsRecurring] = useState(false)

  // Form fields
  const [title, setTitle] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [duration, setDuration] = useState("90")
  const [location, setLocation] = useState("")
  const [firstDate, setFirstDate] = useState("")
  const [time, setTime] = useState("09:00")
  const [frequency, setFrequency] = useState<"weekly" | "biweekly">("weekly")
  const [count, setCount] = useState("10")

  const { data: lessonsData } = useQuery({
    queryKey: ["lessons", groupId],
    queryFn: () => getLessons(groupId),
    enabled: open,
    placeholderData: { data: [], count: 0 },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["lessons", groupId] })
    queryClient.invalidateQueries({ queryKey: ["lessons"] })
  }
  const resetForm = () => {
    setTitle(""); setScheduledAt(""); setDuration("90"); setLocation("")
    setFirstDate(""); setTime("09:00"); setFrequency("weekly"); setCount("10")
  }

  const createOneMutation = useMutation({
    mutationFn: () => createLesson({
      title: title.trim(), scheduled_at: scheduledAt,
      duration_minutes: parseInt(duration) || 90,
      location: location.trim() || null, group_id: groupId,
    }),
    onSuccess: () => { invalidate(); showSuccessToast("Занятие добавлено"); resetForm() },
    onError: () => showErrorToast("Не удалось добавить занятие"),
  })

  const createSeriesMutation = useMutation({
    mutationFn: () => createRecurringLessons({
      title: title.trim(), group_id: groupId,
      first_date: firstDate, time,
      duration_minutes: parseInt(duration) || 90,
      location: location.trim() || null,
      frequency, count: parseInt(count) || 10,
    }),
    onSuccess: (data) => { invalidate(); showSuccessToast(`Создано ${data.count} занятий`); resetForm() },
    onError: () => showErrorToast("Не удалось создать серию"),
  })

  const isPending = createOneMutation.isPending || createSeriesMutation.isPending

  const lessons = (lessonsData?.data ?? []).slice().sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )

  // Group by series, then singletons
  const seriesGroups = new Map<string, Lesson[]>()
  const singles: Lesson[] = []
  for (const l of lessons) {
    if (l.series_id) {
      if (!seriesGroups.has(l.series_id)) seriesGroups.set(l.series_id, [])
      seriesGroups.get(l.series_id)!.push(l)
    } else {
      singles.push(l)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Расписание — {groupName}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Lessons list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {lessons.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Занятий пока нет. Добавьте разовое занятие или создайте серию.
              </p>
            )}

            {/* Series */}
            {Array.from(seriesGroups.entries()).map(([seriesId, items]) => (
              <div key={seriesId}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Серия · {items.length} занятий
                  </span>
                  <div className="flex-1 h-px bg-primary/20" />
                </div>
                <div className="space-y-1.5">
                  {items.map((l) => (
                    <LessonRow key={l.id} lesson={l} onDeleted={invalidate} />
                  ))}
                </div>
              </div>
            ))}

            {/* Singles */}
            {singles.length > 0 && (
              <div>
                {seriesGroups.size > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Разовые занятия
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className="space-y-1.5">
                  {singles.map((l) => (
                    <LessonRow key={l.id} lesson={l} onDeleted={invalidate} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add form */}
          <div className="border-t px-6 py-5 space-y-4 shrink-0 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Добавить занятие</p>
              <div className="flex rounded-md border overflow-hidden text-xs">
                <button
                  type="button"
                  className={`px-3 py-1.5 transition-colors ${!isRecurring ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setIsRecurring(false)}
                >Разовое</button>
                <button
                  type="button"
                  className={`px-3 py-1.5 transition-colors ${isRecurring ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setIsRecurring(true)}
                >Серия</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>{isRecurring ? "Название серии *" : "Тема занятия *"}</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isRecurring ? "Математика (тему можно менять у каждого)" : "Введение. Основные понятия..."}
                />
              </div>

              {!isRecurring ? (
                <div className="space-y-1.5">
                  <Label>Дата и время *</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Первое занятие *</Label>
                    <Input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Время *</Label>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Периодичность</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as "weekly" | "biweekly")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Каждую неделю</SelectItem>
                        <SelectItem value="biweekly">Каждые 2 недели</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Количество занятий</Label>
                    <Input type="number" value={count} onChange={(e) => setCount(e.target.value)} min={1} max={52} />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Длительность (мин)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={15} />
              </div>
              <div className={isRecurring ? "" : "space-y-1.5"}>
                <Label>Место / ссылка</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Аудитория или ссылка" />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => isRecurring ? createSeriesMutation.mutate() : createOneMutation.mutate()}
              disabled={isPending || !title.trim() || (isRecurring ? !firstDate : !scheduledAt)}
            >
              {isPending
                ? "Создание..."
                : isRecurring
                  ? `Создать серию · ${count || 0} занятий`
                  : "Добавить занятие"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProgramDetailPage() {
  const { programId } = useParams({ from: "/_layout/programs/$programId" })
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [editProgramOpen, setEditProgramOpen] = useState(false)
  const [editModule, setEditModule] = useState<Module | null>(null)
  const [addModuleOpen, setAddModuleOpen] = useState(false)
  const [deleteModule_, setDeleteModule] = useState<Module | null>(null)
  const [scheduleGroup, setScheduleGroup] = useState<{ id: string; name: string } | null>(null)
  const [progressJournal, setProgressJournal] = useState<{ id: string; name: string } | null>(null)

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", programId] })
      showSuccessToast("Модуль удалён")
      setDeleteModule(null)
    },
    onError: () => showErrorToast("Не удалось удалить модуль"),
  })

  const role = (user?.role ?? "student").toLowerCase()
  const canManage = user?.is_superuser || role === "admin" || role === "teacher"

  const { data: programsData } = useQuery({ queryKey: ["programs"], queryFn: getPrograms, placeholderData: { data: [], count: 0 } })
  const { data: modulesData } = useQuery({ queryKey: ["modules", programId], queryFn: () => getModules(programId), placeholderData: { data: [], count: 0 } })
  const { data: groupsData } = useQuery({ queryKey: ["groups"], queryFn: getGroups, placeholderData: { data: [], count: 0 } })

  const program = (programsData?.data ?? []).find((p) => p.id === programId)
  const modules = modulesData?.data ?? []
  const groups = (groupsData?.data ?? []).filter((g) => g.program_id === programId)

  const teachersMap = new Map<string, { id: string; name: string; groupCount: number }>()
  for (const g of groups) {
    if (g.teacher_id) {
      const existing = teachersMap.get(g.teacher_id)
      if (existing) existing.groupCount++
      else teachersMap.set(g.teacher_id, { id: g.teacher_id, name: g.teacher_name ?? g.teacher_id, groupCount: 1 })
    }
  }
  const teachers = Array.from(teachersMap.values())

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-muted-foreground">Программа не найдена</p>
        <Link to="/programs"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Назад</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dialogs */}
      <ConfirmDeleteDialog
        open={!!deleteModule_}
        onOpenChange={(o) => !o && setDeleteModule(null)}
        title="Удалить модуль?"
        description={`Модуль «${deleteModule_?.title}» будет удалён безвозвратно.`}
        onConfirm={() => deleteModule_ && deleteModuleMutation.mutate(deleteModule_.id)}
        isPending={deleteModuleMutation.isPending}
      />
      {scheduleGroup && (
        <ScheduleDialog
          open={!!scheduleGroup}
          onOpenChange={(o) => !o && setScheduleGroup(null)}
          groupId={scheduleGroup.id}
          groupName={scheduleGroup.name}
        />
      )}
      {progressJournal && (
        <ProgressJournalSheet
          open={!!progressJournal}
          onOpenChange={(o) => !o && setProgressJournal(null)}
          groupId={progressJournal.id}
          groupName={progressJournal.name}
          programId={programId}
        />
      )}
      {editProgramOpen && (
        <EditProgramDialog open={editProgramOpen} onOpenChange={setEditProgramOpen} program={program} />
      )}
      {editModule && (
        <ModuleFormDialog open={!!editModule} onOpenChange={(o) => !o && setEditModule(null)} programId={programId} module={editModule} nextPosition={modules.length + 1} />
      )}
      {addModuleOpen && (
        <ModuleFormDialog open={addModuleOpen} onOpenChange={setAddModuleOpen} programId={programId} nextPosition={modules.length + 1} />
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/programs">
          <Button variant="ghost" size="sm" className="mt-1">
            <ArrowLeft className="h-4 w-4 mr-1" />Назад
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{program.title}</h1>
              {program.description && <p className="text-muted-foreground mt-1">{program.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <Badge variant={statusVariant(program.status)}>
                {STATUS_LABELS[program.status ?? ""] ?? program.status ?? "—"}
              </Badge>
              {canManage && (
                <Button size="sm" variant="outline" onClick={() => setEditProgramOpen(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />Редактировать
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /><span>{modules.length} модулей</span></div>
            <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span>{groups.length} групп</span></div>
            <div className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" /><span>{teachers.length} преподавателей</span></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Модули <span className="ml-1.5 text-xs opacity-70">({modules.length})</span></TabsTrigger>
          <TabsTrigger value="groups">Группы <span className="ml-1.5 text-xs opacity-70">({groups.length})</span></TabsTrigger>
          <TabsTrigger value="teachers">Преподаватели <span className="ml-1.5 text-xs opacity-70">({teachers.length})</span></TabsTrigger>
        </TabsList>

        {/* Modules */}
        <TabsContent value="modules" className="mt-4 space-y-3">
          {canManage && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAddModuleOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />Добавить модуль
              </Button>
            </div>
          )}
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Модулей пока нет</p>
          ) : (
            modules.map((m, i) => (
              <Card key={m.id}>
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground text-sm shrink-0">{i + 1}.</span>
                      <CardTitle className="text-base">{m.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={MODULE_TYPE_VARIANTS[m.module_type ?? "theoretical"]}>
                        {MODULE_TYPE_LABELS[m.module_type ?? "theoretical"]}
                      </Badge>
                      {canManage && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditModule(m)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => setDeleteModule(m)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {m.description && <p className="text-sm text-muted-foreground mt-1 ml-6">{m.description}</p>}
                </CardHeader>
                {m.content && (
                  <CardContent className="pt-0">
                    <div className="ml-6 rounded-md bg-muted px-4 py-3 text-sm whitespace-pre-wrap">{m.content}</div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* Groups */}
        <TabsContent value="groups" className="mt-4">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Групп пока нет</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((g) => (
                <Card key={g.id}>
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{g.name}</p>
                      <Badge variant={statusVariant(g.status)}>{GROUP_STATUS_LABELS[g.status ?? ""] ?? g.status ?? "—"}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /><span>{g.teacher_name ?? "Преподаватель не назначен"}</span></div>
                      <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /><span>{g.student_count ?? 0} студентов</span></div>
                      {g.start_date && (
                        <div className="text-xs">
                          {new Date(g.start_date).toLocaleDateString("ru-RU")}
                          {g.end_date && ` — ${new Date(g.end_date).toLocaleDateString("ru-RU")}`}
                        </div>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex gap-1.5 mt-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setScheduleGroup({ id: g.id, name: g.name })}>
                          <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                          Расписание
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setProgressJournal({ id: g.id, name: g.name })}>
                          <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                          Прогресс
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Teachers */}
        <TabsContent value="teachers" className="mt-4">
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Преподаватели не назначены</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((t) => (
                <Card key={t.id}>
                  <CardContent className="pt-4 pb-4 flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.groupCount} {t.groupCount === 1 ? "группа" : t.groupCount < 5 ? "группы" : "групп"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
