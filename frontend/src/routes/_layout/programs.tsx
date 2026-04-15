import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BookOpen, Pencil, Plus } from "lucide-react"
import { useState } from "react"

import {
  createModule,
  createProgram,
  getModules,
  getPrograms,
  updateProgram,
} from "@/client/custom-api"
import type { Program } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

function statusLabel(status?: string | null): string {
  const map: Record<string, string> = {
    draft: "Черновик",
    on_review: "На проверке",
    approved: "Одобрена",
    rejected: "Отклонена",
  }
  return map[status ?? ""] ?? (status ?? "—")
}

function statusVariant(
  status?: string | null,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved") return "default"
  if (status === "on_review") return "outline"
  if (status === "rejected") return "destructive"
  return "secondary"
}

// ─── Create / Edit Program Dialog ─────────────────────────────────────────────

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
    onError: () => {
      showErrorToast("Не удалось сохранить программу")
    },
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
            <Label htmlFor="prog-title">Название *</Label>
            <Input
              id="prog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название программы"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-description">Описание</Label>
            <textarea
              id="prog-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание программы"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prog-status">Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="prog-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="on_review">На проверке</SelectItem>
                <SelectItem value="approved">Одобрена</SelectItem>
                <SelectItem value="rejected">Отклонена</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Modules Dialog ───────────────────────────────────────────────────────────

function ModulesDialog({
  open,
  onOpenChange,
  program,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  program: Program
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const { data: modulesData } = useQuery({
    queryKey: ["modules", program.id],
    queryFn: () => getModules(program.id),
    enabled: open,
    placeholderData: { data: [], count: 0 },
  })

  const mutation = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", program.id] })
      queryClient.invalidateQueries({ queryKey: ["modules"] })
      showSuccessToast("Модуль добавлен")
      setTitle("")
      setDescription("")
    },
    onError: () => {
      showErrorToast("Не удалось добавить модуль")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      program_id: program.id,
      position: (modulesData?.data.length ?? 0) + 1,
    })
  }

  const modules = modulesData?.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Модули — {program.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing modules */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Модулей пока нет</p>
            ) : (
              modules.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.title}</p>
                    {m.description && (
                      <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add module form */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Добавить модуль</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mod-title">Название *</Label>
                <Input
                  id="mod-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название модуля"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mod-description">Описание</Label>
                <Input
                  id="mod-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое описание"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Закрыть
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Добавление..." : "Добавить"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Program Card ─────────────────────────────────────────────────────────────

function ProgramCard({
  program,
  moduleCount,
  canManage,
  onEdit,
  onModules,
}: {
  program: Program
  moduleCount: number
  canManage: boolean
  onEdit: (p: Program) => void
  onModules: (p: Program) => void
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-md bg-orange-100 p-2 shrink-0">
              <BookOpen className="h-4 w-4 text-orange-600" />
            </div>
            <CardTitle className="text-base leading-tight truncate">
              {program.title}
            </CardTitle>
          </div>
          <Badge variant={statusVariant(program.status)} className="shrink-0">
            {statusLabel(program.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-2">
        {program.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {program.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{moduleCount} модулей</span>
        </div>
      </CardContent>
      {canManage && (
        <CardFooter className="pt-0 gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(program)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Редактировать
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onModules(program)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Модули
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProgramsPage() {
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProgram, setEditProgram] = useState<Program | null>(null)
  const [modulesProgram, setModulesProgram] = useState<Program | null>(null)

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
    (acc, m) => {
      acc[m.program_id] = (acc[m.program_id] ?? 0) + 1
      return acc
    },
    {},
  )

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки программ</p>
  }

  const programList = programs?.data ?? []

  return (
    <div className="space-y-6">
      {/* Dialogs */}
      <ProgramDialog open={createOpen} onOpenChange={setCreateOpen} />
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
          <h1 className="text-2xl font-bold tracking-tight uppercase">
            Программы
          </h1>
          <p className="text-muted-foreground">
            Образовательные программы платформы
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать программу
          </Button>
        )}
      </div>

      {programList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Программ пока нет</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programList.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              moduleCount={moduleCounts[p.id] ?? 0}
              canManage={canManage}
              onEdit={setEditProgram}
              onModules={setModulesProgram}
            />
          ))}
        </div>
      )}
    </div>
  )
}
