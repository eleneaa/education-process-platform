import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Upload, FileDown, Plus, Pencil, Layers, Send, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import { useState, useMemo } from "react"

import { getPrograms, getModules, getGroups, updateProgram, createProgram, deleteProgram, importProgramsCSV, importModulesCSV, submitProgramForReview } from "@/client/custom-api"
import type { Program, Module } from "@/client/custom-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImportDialog } from "@/components/Common/ImportDialog"
import { ExportPDFDialog, type ExportColumn } from "@/components/Common/ExportPDFDialog"
import useCustomToast from "@/hooks/useCustomToast"
import useAuth from "@/hooks/useAuth"

// Color palette for different programs (same as schedule)
const programColors = [
  { bg: "bg-blue-500/20 dark:bg-blue-500/30", border: "border-blue-600 dark:border-blue-400", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-600 dark:bg-blue-400" },
  { bg: "bg-purple-500/20 dark:bg-purple-500/30", border: "border-purple-600 dark:border-purple-400", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-600 dark:bg-purple-400" },
  { bg: "bg-cyan-500/20 dark:bg-cyan-500/30", border: "border-cyan-600 dark:border-cyan-400", text: "text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-600 dark:bg-cyan-400" },
  { bg: "bg-emerald-500/20 dark:bg-emerald-500/30", border: "border-emerald-600 dark:border-emerald-400", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-600 dark:bg-emerald-400" },
  { bg: "bg-amber-500/20 dark:bg-amber-500/30", border: "border-amber-600 dark:border-amber-400", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-600 dark:bg-amber-400" },
  { bg: "bg-pink-500/20 dark:bg-pink-500/30", border: "border-pink-600 dark:border-pink-400", text: "text-pink-700 dark:text-pink-300", dot: "bg-pink-600 dark:bg-pink-400" },
]

const getProgramColor = (programId: string) => {
  const index = programId.charCodeAt(0) % programColors.length
  return programColors[index]
}

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
  isTeacher: boolean
  onSubmitForReview?: (programId: string) => void
  onApprove?: (programId: string) => void
  onReject?: (programId: string) => void
  isSubmitting?: boolean
}

function ProgramCard({
  program,
  moduleCount,
  groupCount,
  isTeacher,
  onSubmitForReview,
  onApprove,
  onReject,
  isSubmitting = false
}: ProgramCardProps) {
  const status = program.status || "draft"
  const color = getProgramColor(program.id)

  return (
    <Card className={`border-hair rounded-2xl overflow-hidden p-0 flex flex-col h-full border-l-4 ${color.border}`}>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.dot}`} />
          <div className="label-sm text-mute">{STATUS_LABELS[status]}</div>
        </div>
        <h3 className="heading-sm text-fg mb-4 line-clamp-2">{program.title}</h3>
        <div className="mb-6">
          <Badge variant={getStatusChipVariant(status)} className="font-medium">
            {STATUS_LABELS[status]}
          </Badge>
        </div>

        {/* Teachers list */}
        {program.teachers && program.teachers.length > 0 && (
          <div className="mb-4 pb-4 border-b border-hair">
            <div className="label-sm text-mute mb-2">ПРЕПОДАВАТЕЛИ</div>
            <div className="text-sm text-fg space-y-1">
              {program.teachers.map((teacher) => (
                <div key={teacher.id}>{teacher.full_name}</div>
              ))}
            </div>
          </div>
        )}

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

        <div className="flex gap-2 mt-auto flex-wrap">
          <Link to="/programs_/$programId" params={{ programId: program.id }}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <Pencil className="h-4 w-4" />
              Редакт.
            </Button>
          </Link>

          {isTeacher && status === "draft" && onSubmitForReview && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onSubmitForReview(program.id)}
              disabled={isSubmitting}
              className="gap-1"
            >
              <Send className="h-4 w-4" />
              На согласование
            </Button>
          )}

          {!isTeacher && status === "on_review" && onApprove && onReject && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onApprove(program.id)}
                disabled={isSubmitting}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Одобрить
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(program.id)}
                disabled={isSubmitting}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Отклонить
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

function QuickCreateProgramDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (data: { title: string; description: string | null }) => void
  isLoading: boolean
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim() || null })
    setTitle("")
    setDescription("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создать программу</DialogTitle>
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
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание программы"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground min-h-16 resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Создание..." : "Создать"}
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
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const isTeacher = currentUser?.role?.toLowerCase() === "teacher"
  const isAdmin = currentUser?.role?.toLowerCase() === "admin" || currentUser?.is_superuser

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
    mutationFn: (data: { title: string; description: string | null }) => createProgram(data),
    onSuccess: (created) => {
      console.log("Program created successfully:", created)
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа создана")
      setCreateDialogOpen(false)
      const programId = String(created.id)
      console.log("Navigating to program:", programId)
      navigate({
        to: `/programs_/${programId}`,
      })
    },
    onError: (error) => {
      console.error("Error creating program:", error)
      showErrorToast("Ошибка при создании")
    },
  })

  const submitForReviewMutation = useMutation({
    mutationFn: (programId: string) => submitProgramForReview(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа отправлена на согласование")
    },
    onError: () => showErrorToast("Ошибка при отправке на согласование"),
  })

  const approveMutation = useMutation({
    mutationFn: (programId: string) => updateProgram(programId, { status: "approved" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа одобрена")
    },
    onError: () => showErrorToast("Ошибка при одобрении"),
  })

  const rejectMutation = useMutation({
    mutationFn: (programId: string) => updateProgram(programId, { status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] })
      showSuccessToast("Программа отклонена")
    },
    onError: () => showErrorToast("Ошибка при отклонении"),
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
    setCreateDialogOpen(true)
  }

  const getModuleCount = (programId: string) => modules.filter((m) => m.program_id === programId).length
  const getGroupCount = (programId: string) => groups.filter((g) => g.program_id === programId).length

  return (
    <div className="min-h-screen bg-background">
      <div className="divider-h border-b sticky top-0 bg-background z-50">
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
            {!isTeacher && (
              <>
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
              </>
            )}
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

      {!isTeacher && (
        <div className="px-10">
          <div className="grid grid-cols-4 gap-0 py-6 border-y border-hair">
            <KPIBar value={kpiByStatus.draft} label="ЧЕРНОВИК" />
            <KPIBar value={kpiByStatus.on_review} label="НА ПРОВЕРКЕ" />
            <KPIBar value={kpiByStatus.approved} label="ОДОБРЕНА" />
            <KPIBar value={kpiByStatus.rejected} label="ОТКЛОНЕНА" />
          </div>
        </div>
      )}

      <div className="px-10 py-12">
        {filteredPrograms.length > 0 ? (
          <div className="grid grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <div key={program.id}>
                <ProgramCard
                  program={program}
                  moduleCount={getModuleCount(program.id)}
                  groupCount={getGroupCount(program.id)}
                  isTeacher={isTeacher}
                  onSubmitForReview={isTeacher ? (id) => submitForReviewMutation.mutate(id) : undefined}
                  onApprove={isAdmin ? (id) => approveMutation.mutate(id) : undefined}
                  onReject={isAdmin ? (id) => rejectMutation.mutate(id) : undefined}
                  isSubmitting={submitForReviewMutation.isPending || approveMutation.isPending || rejectMutation.isPending}
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

      <QuickCreateProgramDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {!isTeacher && (
        <ExportPDFDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          title="Программы обучения"
          columns={PROGRAM_EXPORT_COLUMNS}
          data={filteredPrograms as unknown as Record<string, unknown>[]}
          exportType="programs"
        />
      )}
    </div>
  )
}
