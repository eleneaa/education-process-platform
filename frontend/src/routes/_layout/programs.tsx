import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BookOpen, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"

import {
  createModule,
  createProgram,
  deleteProgram,
  getModules,
  getPrograms,
  updateModule,
  updateProgram,
} from "@/client/custom-api"
import type { Module, Program } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
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
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/programs")({
  component: ProgramsPage,
  head: () => ({
    meta: [{ title: "Программы" }],
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

function statusVariant(
  status?: string | null,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved") return "default"
  if (status === "on_review") return "outline"
  if (status === "rejected") return "destructive"
  return "secondary"
}

// ─── Program Dialog (create / edit) ──────────────────────────────────────────

function ProgramDialog({
  open,
  onOpenChange,
  program,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  program?: Program
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const isEdit = !!program

  const [title, setTitle] = useState(program?.title ?? "")
  const [description, setDescription] = useState(program?.description ?? "")
  const [status, setStatus] = useState(program?.status ?? "draft")

  const mutation = useMutation({
    mutationFn: (body: { title: string; description: string | null; status: string }) =>
      isEdit ? updateProgram(program!.id, body) : createProgram(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast(isEdit ? "Программа обновлена" : "Программа создана")
      onOpenChange(false)
    },
    onError: () => showErrorToast("Не удалось сохранить программу"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    mutation.mutate({ title: title.trim(), description: description.trim() || null, status })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать программу" : "Создать программу"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Название *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Введите название" required />
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание программы"
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
              {mutation.isPending ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Module Dialog (create / edit) ───────────────────────────────────────────

function ModuleFormDialog({
  open,
  onOpenChange,
  programId,
  module,
  nextPosition,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  programId: string
  module?: Module
  nextPosition: number
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
        ? updateModule(module!.id, {
            title: title.trim(),
            description: description.trim() || null,
            module_type: moduleType,
            content: content.trim() || null,
          })
        : createModule({
            title: title.trim(),
            description: description.trim() || null,
            program_id: programId,
            position: nextPosition,
            module_type: moduleType,
            content: content.trim() || null,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", programId] })
      queryClient.invalidateQueries({ queryKey: ["modules"] })
      showSuccessToast(isEdit ? "Модуль обновлён" : "Модуль добавлен")
      onOpenChange(false)
    },
    onError: () => showErrorToast("Не удалось сохранить модуль"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать модуль" : "Добавить модуль"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Название *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название модуля" required />
            </div>
            <div className="space-y-1.5">
              <Label>Тип модуля</Label>
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

// ─── Modules Manager Dialog ───────────────────────────────────────────────────

function ModulesDialog({
  open,
  onOpenChange,
  program,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  program: Program
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editModule, setEditModule] = useState<Module | null>(null)

  const { data: modulesData } = useQuery({
    queryKey: ["modules", program.id],
    queryFn: () => getModules(program.id),
    enabled: open,
    placeholderData: { data: [], count: 0 },
  })

  const modules = modulesData?.data ?? []

  return (
    <>
      {addOpen && (
        <ModuleFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          programId={program.id}
          nextPosition={modules.length + 1}
        />
      )}
      {editModule && (
        <ModuleFormDialog
          open={!!editModule}
          onOpenChange={(o) => !o && setEditModule(null)}
          programId={program.id}
          module={editModule}
          nextPosition={modules.length + 1}
        />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Модули — {program.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Модулей пока нет</p>
            ) : (
              modules.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 rounded-md border px-3 py-2.5"
                >
                  <span className="text-muted-foreground text-sm shrink-0 mt-0.5">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{m.title}</p>
                      <Badge
                        variant={MODULE_TYPE_VARIANTS[m.module_type ?? "theoretical"]}
                        className="text-xs shrink-0"
                      >
                        {MODULE_TYPE_LABELS[m.module_type ?? "theoretical"]}
                      </Badge>
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{m.description}</p>
                    )}
                    {m.content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                        {m.content.slice(0, 80)}{m.content.length > 80 ? "..." : ""}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 shrink-0"
                    onClick={() => setEditModule(m)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить модуль
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({
  program,
  moduleCount,
  canManage,
  onEdit,
  onModules,
  onDelete,
}: {
  program: Program
  moduleCount: number
  canManage: boolean
  onEdit: (p: Program) => void
  onModules: (p: Program) => void
  onDelete: (p: Program) => void
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-md bg-primary/10 p-2 shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base leading-tight truncate">{program.title}</CardTitle>
          </div>
          <Badge variant={statusVariant(program.status)} className="shrink-0">
            {STATUS_LABELS[program.status ?? ""] ?? program.status ?? "—"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-2">
        {program.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{program.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{moduleCount} модулей</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0 gap-2">
        <Link to="/programs/$programId" params={{ programId: program.id }} className="flex-1">
          <Button size="sm" variant="outline" className="w-full">
            <Eye className="h-3.5 w-3.5 mr-1" />
            Открыть
          </Button>
        </Link>
        {canManage && (
          <>
            <Button size="sm" variant="outline" onClick={() => onEdit(program)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onModules(program)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(program)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "on_review", label: "На проверке" },
  { value: "approved", label: "Одобренные" },
  { value: "rejected", label: "Отклонённые" },
]

function ProgramsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProgram, setEditProgram] = useState<Program | null>(null)
  const [modulesProgram, setModulesProgram] = useState<Program | null>(null)
  const [deleteProgram_, setDeleteProgram] = useState<Program | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа удалена")
      setDeleteProgram(null)
    },
    onError: () => showErrorToast("Не удалось удалить программу"),
  })

  const { data: programs, isError } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })
  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: () => getModules(),
    placeholderData: { data: [], count: 0 },
  })

  const role = (user?.role ?? "student").toLowerCase()
  const canManage = user?.is_superuser || role === "admin" || role === "teacher"

  const moduleCounts = (modules?.data ?? []).reduce<Record<string, number>>(
    (acc, m) => { acc[m.program_id] = (acc[m.program_id] ?? 0) + 1; return acc },
    {},
  )

  if (isError) return <p className="text-destructive">Ошибка загрузки программ</p>

  const allPrograms = programs?.data ?? []
  const filtered = allPrograms.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <ProgramDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDeleteDialog
        open={!!deleteProgram_}
        onOpenChange={(o) => !o && setDeleteProgram(null)}
        title="Удалить программу?"
        description={`Программа «${deleteProgram_?.title}» и все её модули будут удалены безвозвратно.`}
        onConfirm={() => deleteProgram_ && deleteMutation.mutate(deleteProgram_.id)}
        isPending={deleteMutation.isPending}
      />
      {editProgram && (
        <ProgramDialog
          open={!!editProgram}
          onOpenChange={(o) => !o && setEditProgram(null)}
          program={editProgram}
        />
      )}
      {modulesProgram && (
        <ModulesDialog
          open={!!modulesProgram}
          onOpenChange={(o) => !o && setModulesProgram(null)}
          program={modulesProgram}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Программы</h1>
          <p className="text-muted-foreground">Образовательные программы платформы</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать программу
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={statusFilter === f.value ? "default" : "outline"}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {search || statusFilter !== "all" ? "Ничего не найдено" : "Программ пока нет"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              moduleCount={moduleCounts[p.id] ?? 0}
              canManage={canManage}
              onEdit={setEditProgram}
              onModules={setModulesProgram}
              onDelete={setDeleteProgram}
            />
          ))}
        </div>
      )}
    </div>
  )
}
