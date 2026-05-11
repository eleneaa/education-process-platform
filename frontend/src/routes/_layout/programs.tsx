import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Upload, FileDown, Plus, Pencil, Layers } from "lucide-react"
import { useState, useMemo } from "react"

import { getPrograms, getModules, getGroups, updateProgram, createProgram, deleteProgram, importProgramsCSV, importModulesCSV } from "@/client/custom-api"
import type { Program, Module } from "@/client/custom-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImportDialog } from "@/components/Common/ImportDialog"
import { ExportPDFDialog, type ExportColumn } from "@/components/Common/ExportPDFDialog"
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

function getStatusChipVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default"
    case "on_review":
      return "outline"
    case "rejected":
      return "destructive"
    case "draft":
      return "secondary"
    default:
      return "outline"
  }
}

interface KPIBarProps {
  value: number
  label: string
}

function KPIBar({ value, label }: KPIBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="label-sm">{label}</div>
      <div className="mono text-2xl font-light" style={{ letterSpacing: "-0.04em" }}>
        {value}
      </div>
    </div>
  )
}

interface ProgramCardProps {
  program: Program
  moduleCount: number
  groupCount: number
  onEdit: (program: Program) => void
}

function ProgramCard({ program, moduleCount, groupCount, onEdit }: ProgramCardProps) {
  const status = program.status || "draft"

  return (
    <Card className="border-hair rounded-2xl overflow-hidden p-0 flex flex-col h-full">
      <div className="p-6 flex flex-col flex-1">
        <div className="label-sm text-mute mb-3">{STATUS_LABELS[status]}</div>
        <h3 className="heading-sm text-fg mb-4 line-clamp-2">{program.title}</h3>
        <div className="mb-6">
          <Badge variant={getStatusChipVariant(status)} className="font-medium">
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-hair mb-6">
          <div className="flex flex-col gap-1">
            <div className="label-sm text-mute">МОДУЛЕЙ</div>
            <div className="mono text-xl font-light">{moduleCount}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="label-sm text-mute">ГРУПП</div>
            <div className="mono text-xl font-light">{groupCount}</div>
          </div>
        </div>
        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(program)}
            className="flex-1 gap-1"
          >
            <Pencil className="h-4 w-4" />
            Редакт.
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ProgramFormDialog({
  open,
  onOpenChange,
  program,
  onSubmit,
  isLoading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  program?: Program
  onSubmit: (data: { title: string; description: string | null; status: string }) => void
  isLoading: boolean
}) {
  const [title, setTitle] = useState(program?.title ?? "")
  const [description, setDescription] = useState(program?.description ?? "")
  const [status, setStatus] = useState(program?.status ?? "draft")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description || null, status })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{program ? "Редактировать программу" : "Создать программу"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название программы"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground min-h-20 resize-none"
            />
          </div>
          <div>
            <Label htmlFor="status">Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="mt-1">
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Сохранение..." : program ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const PROGRAM_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "title", label: "Название", defaultEnabled: true },
  { key: "description", label: "Описание", defaultEnabled: true, format: (v) => (v ? String(v).slice(0, 120) : "—") },
  { key: "status", label: "Статус", defaultEnabled: true, format: (v) => STATUS_LABELS[String(v)] ?? "—" },
  { key: "created_at", label: "Дата", defaultEnabled: true, format: (v) => (v ? new Date(String(v)).toLocaleDateString("ru-RU") : "—") },
]

function ProgramsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | undefined>()
  const [exportOpen, setExportOpen] = useState(false)

  const { data: programsResponse } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
  })

  const { data: modulesResponse } = useQuery({
    queryKey: ["modules"],
    queryFn: () => getModules(),
  })

  const { data: groupsResponse } = useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroups(),
  })

  const programs = programsResponse?.data ?? []
  const modules = modulesResponse?.data ?? []
  const groups = groupsResponse?.data ?? []

  const createMutation = useMutation({
    mutationFn: createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа создана")
      setFormOpen(false)
    },
    onError: () => showErrorToast("Ошибка при создании"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа обновлена")
      setFormOpen(false)
      setEditingProgram(undefined)
    },
    onError: () => showErrorToast("Ошибка при обновлении"),
  })

  const kpiByStatus = useMemo(() => {
    return {
      draft: programs.filter((p) => p.status === "draft").length,
      on_review: programs.filter((p) => p.status === "on_review").length,
      approved: programs.filter((p) => p.status === "approved").length,
      rejected: programs.filter((p) => p.status === "rejected").length,
    }
  }, [programs])

  const filteredPrograms = useMemo(() => {
    if (!search) return programs
    const q = search.toLowerCase()
    return programs.filter((p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
  }, [search, programs])

  const handleCreateProgram = () => {
    setEditingProgram(undefined)
    setFormOpen(true)
  }

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program)
    setFormOpen(true)
  }

  const handleSubmit = (data: any) => {
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const getModuleCount = (programId: string) => modules.filter((m) => m.program_id === programId).length
  const getGroupCount = (programId: string) => groups.filter((g) => g.program_id === programId).length

  return (
    <div className="min-h-screen bg-background">
      <div className="divider-h border-b sticky top-0 bg-background z-40">
        <div className="flex items-center justify-between px-10 py-5 gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-mute" />
            <Input
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent text-sm placeholder:text-mute focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <ImportDialog
              trigger={<><Upload className="w-4 h-4" />Программы</>}
              title="Импорт программ"
              description="CSV файл с программами"
              templateColumns={["title", "description", "status"]}
              templateColumnLabels={{ title: "Название", description: "Описание", status: "Статус" }}
              templateFilename="programs_template.csv"
              onImport={importProgramsCSV}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["programs"] })}
            />
            <ImportDialog
              trigger={<><Upload className="w-4 h-4" />Модули</>}
              title="Импорт модулей"
              description="CSV файл с модулями"
              templateColumns={["title", "description", "program_title", "module_type"]}
              templateColumnLabels={{ title: "Название", description: "Описание", program_title: "Программа", module_type: "Тип" }}
              templateFilename="modules_template.csv"
              onImport={importModulesCSV}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["modules"] })}
            />
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="gap-2">
              <FileDown className="w-4 h-4" />
              Экспорт
            </Button>
            <Button onClick={handleCreateProgram} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Создать
            </Button>
          </div>
        </div>
      </div>

      <div className="px-10 py-4">
        <div className="eyebrow">ПРОГРАММЫ ПОДГОТОВКИ</div>
      </div>

      <div className="px-10 py-8">
        <h1 className="display-hero mb-2">
          <em className="not-italic text-accent font-medium">{programs.length}</em> программы подготовки.
        </h1>
        <p className="body-md text-mute max-w-2xl">Полный каталог образовательных программ.</p>
      </div>

      <div className="px-10">
        <div className="grid grid-cols-4 gap-0 py-6 border-y border-hair">
          <KPIBar value={kpiByStatus.draft} label="ЧЕРНОВИК" />
          <KPIBar value={kpiByStatus.on_review} label="НА ПРОВЕРКЕ" />
          <KPIBar value={kpiByStatus.approved} label="ОДОБРЕНА" />
          <KPIBar value={kpiByStatus.rejected} label="ОТКЛОНЕНА" />
        </div>
      </div>

      <div className="px-10 py-12">
        {filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-3 gap-6">
            {filteredPrograms.map((program, idx) => (
              <div key={program.id} className={idx === 0 ? "col-span-2 row-span-2" : ""}>
                <ProgramCard
                  program={program}
                  moduleCount={getModuleCount(program.id)}
                  groupCount={getGroupCount(program.id)}
                  onEdit={handleEditProgram}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="body-md text-mute">Нет программ</p>
          </div>
        )}
      </div>

      <ProgramFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        program={editingProgram}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ExportPDFDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Программы обучения"
        columns={PROGRAM_EXPORT_COLUMNS}
        data={filteredPrograms as unknown as Record<string, unknown>[]}
        exportType="programs"
      />
    </div>
  )
}
