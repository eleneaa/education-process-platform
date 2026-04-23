import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  BookOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  Layers,
  Grid,
  List as ListIcon,
} from "lucide-react"
import { useState } from "react"

import {
  createModule,
  createProgram,
  deleteProgram,
  deleteModule,
  getModules,
  getPrograms,
  updateModule,
  updateProgram,
} from "@/client/custom-api"
import type { Module, Program } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RightPanel } from "@/components/RightPanel"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/programs")({
  component: ProgramsPage,
  head: () => ({
    meta: [{ title: "Программы" }],
  }),
})

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  on_review: "На проверке",
  approved: "Одобрена",
  rejected: "Отклонена",
}

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  on_review: "outline",
  approved: "default",
  rejected: "destructive",
}

// ─── Program Form ────────────────────────────────────────────────────────────

function ProgramForm({
  program,
  onSubmit,
  onCancel,
  isLoading,
}: {
  program?: Program
  onSubmit: (data: { title: string; description: string | null; status: string }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const isEdit = !!program
  const [title, setTitle] = useState(program?.title ?? "")
  const [description, setDescription] = useState(program?.description ?? "")
  const [status, setStatus] = useState(program?.status ?? "draft")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description || null, status })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title" className="text-base font-semibold">
          Название программы
        </Label>
        <Input
          id="title"
          placeholder="Введите название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-base font-semibold">
          Описание
        </Label>
        <textarea
          id="description"
          placeholder="Введите описание программы"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          className="
            mt-2 w-full px-3 py-2 rounded-lg border border-input
            bg-background text-foreground placeholder-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-24 resize-none
          "
        />
      </div>

      <div>
        <Label htmlFor="status" className="text-base font-semibold">
          Статус
        </Label>
        <Select value={status} onValueChange={setStatus} disabled={isLoading}>
          <SelectTrigger id="status" className="mt-2">
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

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="flex-1"
        >
          {isLoading ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Отмена
        </Button>
      </div>
    </form>
  )
}

// ─── Module Form ────────────────────────────────────────────────────────────

function ModuleForm({
  module,
  onSubmit,
  onCancel,
  isLoading,
}: {
  module?: Module
  onSubmit: (data: {
    title: string
    description: string | null
    position?: number
    module_type?: string
    content?: string
  }) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const isEdit = !!module
  const [title, setTitle] = useState(module?.title ?? "")
  const [description, setDescription] = useState(module?.description ?? "")
  const [moduleType, setModuleType] = useState<string>(module?.module_type ?? "theoretical")
  const [position, setPosition] = useState(module?.position?.toString() ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      description: description || null,
      position: position ? parseInt(position) : undefined,
      module_type: moduleType,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="module-title" className="text-base font-semibold">
          Название модуля
        </Label>
        <Input
          id="module-title"
          placeholder="Введите название модуля"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="module-type" className="text-base font-semibold">
            Тип модуля
          </Label>
          <Select value={moduleType} onValueChange={setModuleType} disabled={isLoading}>
            <SelectTrigger id="module-type" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="theoretical">Теоретический</SelectItem>
              <SelectItem value="practical">Практический</SelectItem>
              <SelectItem value="test">Тестовый</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="module-position" className="text-base font-semibold">
            Позиция
          </Label>
          <Input
            id="module-position"
            type="number"
            placeholder="1"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="mt-2"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="module-description" className="text-base font-semibold">
          Описание
        </Label>
        <textarea
          id="module-description"
          placeholder="Описание модуля"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          className="
            mt-2 w-full px-3 py-2 rounded-lg border border-input
            bg-background text-foreground placeholder-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            min-h-20 resize-none
          "
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="flex-1"
        >
          {isLoading ? "Сохранение..." : isEdit ? "Сохранить" : "Добавить"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Отмена
        </Button>
      </div>
    </form>
  )
}

// ─── Program Card ────────────────────────────────────────────────────────────

interface ProgramCardProps {
  program: Program
  moduleCount: number
  onEdit: (program: Program) => void
  onDelete: (program: Program) => void
  onManageModules: (program: Program) => void
}

function ProgramCard({
  program,
  moduleCount,
  onEdit,
  onDelete,
  onManageModules,
}: ProgramCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                {program.title}
              </h3>
              {program.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {program.description}
                </p>
              )}
            </div>
            <BookOpen className="h-6 w-6 text-primary/40 shrink-0" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant={statusColor[program.status || "draft"]}>
              {STATUS_LABELS[program.status || "draft"]}
            </Badge>
            <Badge variant="outline">
              <Layers className="h-3 w-3 mr-1" />
              {moduleCount} модулей
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onManageModules(program)}
              className="flex-1 text-xs"
            >
              <Layers className="h-4 w-4 mr-2" />
              Модули
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(program)}
              className="flex-1 text-xs"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive hover:bg-destructive/10 flex-1 text-xs"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => onDelete(program)}
        title="Удалить программу?"
        description={`Вы уверены, что хотите удалить программу "${program.title}"? Это действие необратимо.`}
      />
    </>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function ProgramsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "date">("date")

  // Program form state
  const [programFormOpen, setProgramFormOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | undefined>()

  // Module form state
  const [moduleFormOpen, setModuleFormOpen] = useState(false)
  const [managingProgram, setManagingProgram] = useState<Program | undefined>()
  const [editingModule, setEditingModule] = useState<Module | undefined>()

  // Queries
  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(),
    select: (data) => data.data ?? [],
  })

  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: () => getModules(),
    select: (data) => data.data ?? [],
  })

  // Mutations
  const createProgramMutation = useMutation({
    mutationFn: createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа создана")
      setProgramFormOpen(false)
    },
    onError: () => showErrorToast("Ошибка при создании программы"),
  })

  const updateProgramMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа обновлена")
      setProgramFormOpen(false)
      setEditingProgram(undefined)
    },
    onError: () => showErrorToast("Ошибка при обновлении программы"),
  })

  const deleteProgramMutation = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа удалена")
    },
    onError: () => showErrorToast("Ошибка при удалении программы"),
  })

  const createModuleMutation = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] })
      showSuccessToast("Модуль добавлен")
      setModuleFormOpen(false)
      setEditingModule(undefined)
    },
    onError: () => showErrorToast("Ошибка при добавлении модуля"),
  })

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateModule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] })
      showSuccessToast("Модуль обновлен")
      setModuleFormOpen(false)
      setEditingModule(undefined)
    },
    onError: () => showErrorToast("Ошибка при обновлении модуля"),
  })

  const deleteModuleMutation = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] })
      showSuccessToast("Модуль удален")
    },
    onError: () => showErrorToast("Ошибка при удалении модуля"),
  })

  const handleCreateProgram = () => {
    setEditingProgram(undefined)
    setProgramFormOpen(true)
  }

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program)
    setProgramFormOpen(true)
  }

  const handleSubmitProgramForm = (data: any) => {
    if (editingProgram) {
      updateProgramMutation.mutate({ id: editingProgram.id, data })
    } else {
      createProgramMutation.mutate(data)
    }
  }

  const handleManageModules = (program: Program) => {
    setManagingProgram(program)
  }

  const handleCreateModule = () => {
    if (!managingProgram) return
    setEditingModule(undefined)
    setModuleFormOpen(true)
  }

  const handleEditModule = (module: Module) => {
    setEditingModule(module)
    setModuleFormOpen(true)
  }

  const handleSubmitModuleForm = (data: any) => {
    if (!managingProgram) return
    const payload = { ...data, program_id: managingProgram.id }
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data: payload })
    } else {
      createModuleMutation.mutate(payload)
    }
  }

  const filteredPrograms = programs
    .filter((p) => {
      // Search filter
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "all" || p.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title)
      } else {
        // Sort by date (newest first)
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      }
    })

  const programModules = (programId: string) =>
    modules.filter((m) => m.program_id === programId)

  return (
    <div className="flex flex-col h-full gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Программы обучения</h1>
          <p className="text-muted-foreground mt-2">
            Всего программ: {filteredPrograms.length}
          </p>
        </div>
        <Button
          onClick={handleCreateProgram}
          size="lg"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Создать программу
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск программ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="on_review">На проверке</SelectItem>
                <SelectItem value="approved">Одобрена</SelectItem>
                <SelectItem value="rejected">Отклонена</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "date")}>
              <SelectTrigger>
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">По дате (новые первыми)</SelectItem>
                <SelectItem value="name">По названию (А-Я)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Programs Grid/List */}
      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max"
            : "space-y-3"
        }
      >
        {filteredPrograms.length > 0 ? (
          filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              moduleCount={programModules(program.id).length}
              onEdit={handleEditProgram}
              onDelete={(p) => deleteProgramMutation.mutate(p.id)}
              onManageModules={handleManageModules}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold text-foreground">Нет программ</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Создайте первую программу обучения
            </p>
          </div>
        )}
      </div>

      {/* Program Form Panel */}
      <RightPanel
        isOpen={programFormOpen}
        onClose={() => {
          setProgramFormOpen(false)
          setEditingProgram(undefined)
        }}
        title={editingProgram ? "Редактировать программу" : "Создать программу"}
        description={editingProgram ? "Измените данные программы" : "Добавьте новую программу обучения"}
      >
        <ProgramForm
          program={editingProgram}
          onSubmit={handleSubmitProgramForm}
          onCancel={() => {
            setProgramFormOpen(false)
            setEditingProgram(undefined)
          }}
          isLoading={createProgramMutation.isPending || updateProgramMutation.isPending}
        />
      </RightPanel>

      {/* Modules Panel */}
      <RightPanel
        isOpen={!!managingProgram}
        onClose={() => {
          setManagingProgram(undefined)
          setEditingModule(undefined)
        }}
        title={managingProgram?.title || ""}
        description="Управление модулями"
        width="lg"
      >
        {managingProgram && (
          <div className="space-y-4">
            <Button
              onClick={handleCreateModule}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Добавить модуль
            </Button>

            <div className="space-y-3">
              {programModules(managingProgram.id).length > 0 ? (
                programModules(managingProgram.id).map((module) => (
                  <Card
                    key={module.id}
                    className="overflow-hidden"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">
                            {module.title}
                          </h4>
                          {module.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {module.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditModule(module)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => deleteModuleMutation.mutate(module.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Layers className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Нет модулей</p>
                </div>
              )}
            </div>
          </div>
        )}
      </RightPanel>

      {/* Module Form Panel */}
      <RightPanel
        isOpen={moduleFormOpen}
        onClose={() => {
          setModuleFormOpen(false)
          setEditingModule(undefined)
        }}
        title={editingModule ? "Редактировать модуль" : "Добавить модуль"}
        description={managingProgram?.title}
        width="md"
      >
        {managingProgram && (
          <ModuleForm
            module={editingModule}
            onSubmit={handleSubmitModuleForm}
            onCancel={() => {
              setModuleFormOpen(false)
              setEditingModule(undefined)
            }}
            isLoading={createModuleMutation.isPending || updateModuleMutation.isPending}
          />
        )}
      </RightPanel>
    </div>
  )
}
