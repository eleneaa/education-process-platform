import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FileDown, Plus, Search, Upload, MoreVertical } from "lucide-react"
import { useState, useMemo } from "react"

import {
  createAdmissionRequest,
  getAdmissionRequests,
  updateAdmissionRequest,
  importAdmissionRequestsCSV,
} from "@/client/custom-api"
import type { AdmissionRequest } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { ExportPDFDialog, type ExportColumn } from "@/components/Common/ExportPDFDialog"
import { ImportDialog } from "@/components/Common/ImportDialog"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/admission-requests")({
  component: AdmissionRequestsPage,
  head: () => ({
    meta: [{ title: "Заявки" }],
  }),
})

const STATUS_LABELS: Record<string, string> = {
  new: "Новые",
  in_review: "На проверке",
  approved: "Одобрена",
  rejected: "Отклонена",
}

const SOURCE_LABELS: Record<string, string> = {
  website: "Сайт",
  telegram: "Telegram",
  email: "Email",
  phone: "Телефон",
  offline: "Офлайн",
}

const ADMISSION_EXPORT_COLUMNS: ExportColumn[] = [
  { key: "full_name", label: "ФИО", defaultEnabled: true },
  { key: "email", label: "Email", defaultEnabled: true, format: (v) => (v ? String(v) : "—") },
  { key: "phone_number", label: "Телефон", defaultEnabled: true },
  {
    key: "source",
    label: "Источник",
    defaultEnabled: true,
    format: (v) => SOURCE_LABELS[String(v)] ?? "—",
  },
  {
    key: "status",
    label: "Статус",
    defaultEnabled: true,
    format: (v) => STATUS_LABELS[String(v)] ?? "—",
  },
  {
    key: "created_at",
    label: "Дата заявки",
    defaultEnabled: true,
    format: (v) => (v ? new Date(String(v)).toLocaleDateString("ru-RU") : "—"),
  },
]

// ─── Create Request Dialog ────────────────────────────────────────────────────

function CreateRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [programInterest, setProgramInterest] = useState("")
  const [source, setSource] = useState("website")

  const mutation = useMutation({
    mutationFn: createAdmissionRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      showSuccessToast("Заявка создана")
      onOpenChange(false)
      setFullName("")
      setEmail("")
      setPhone("")
      setProgramInterest("")
      setSource("website")
    },
    onError: () => showErrorToast("Ошибка при создании заявки"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) return
    mutation.mutate({
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone_number: phone.trim(),
      program_interest: programInterest.trim() || null,
      source,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая заявка</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              ФИО *
            </Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              Телефон *
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="program" className="text-sm font-medium">
              Интерес к программе
            </Label>
            <Input
              id="program"
              value={programInterest}
              onChange={(e) => setProgramInterest(e.target.value)}
              placeholder="Название программы"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="source" className="text-sm font-medium">
              Источник
            </Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="source" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Сайт</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Телефон</SelectItem>
                <SelectItem value="offline">Офлайн</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  status: string
  title: string
  index: number
  requests: AdmissionRequest[]
  onStatusChange: (requestId: string, newStatus: string) => void
}

function KanbanColumn({ status, title, index, requests, onStatusChange }: KanbanColumnProps) {
  return (
    <div className="flex flex-col flex-1 min-w-80">
      {/* Column Header */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-hair">
        <span className="label-sm text-mute">0{index + 1} ЭТАП</span>
        <h3 className="heading-sm text-fg flex-1">{title}</h3>
        <span className="mono text-sm font-medium text-accent">{requests.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 flex-1">
        {requests.map((req) => (
          <AdmissionCard key={req.id} request={req} onStatusChange={onStatusChange} />
        ))}
        {requests.length === 0 && <div className="text-center py-8 text-mute text-sm">Нет заявок</div>}
      </div>
    </div>
  )
}

// ─── Admission Card ───────────────────────────────────────────────────────────

interface AdmissionCardProps {
  request: AdmissionRequest
  onStatusChange: (requestId: string, newStatus: string) => void
}

function AdmissionCard({ request, onStatusChange }: AdmissionCardProps) {
  const [open, setOpen] = useState(false)
  const [newStatus, setNewStatus] = useState(request.status)

  const handleStatusChange = () => {
    if (newStatus !== request.status) {
      onStatusChange(request.id, newStatus)
    }
    setOpen(false)
  }

  const createdDate = request.created_at
    ? new Date(request.created_at).toLocaleDateString("ru-RU", {
        month: "short",
        day: "numeric",
      })
    : "—"

  return (
    <Card className="border-hair rounded-2xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      {/* Header: ID + Date */}
      <div className="flex items-start justify-between gap-2">
        <span className="mono text-xs text-mute">#{request.id.slice(0, 8)}</span>
        <span className="mono text-xs text-mute">{createdDate}</span>
      </div>

      {/* Name */}
      <div>
        <p className="body-sm text-fg font-medium truncate">{request.full_name}</p>
      </div>

      {/* Program Interest */}
      {request.program_interest && <p className="body-xs text-mute line-clamp-1">{request.program_interest}</p>}

      {/* Footer: Source */}
      <div className="flex items-center justify-between pt-2 border-t border-hair">
        <span className="label-sm text-mute">{SOURCE_LABELS[request.source] || request.source}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-6 w-6 p-0"
        >
          <MoreVertical className="w-4 h-4 text-mute" />
        </Button>
      </div>

      {/* Status Change Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Изменить статус</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-mute">{request.full_name}</p>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Новые</SelectItem>
                <SelectItem value="in_review">На проверке</SelectItem>
                <SelectItem value="approved">Одобрена</SelectItem>
                <SelectItem value="rejected">Отклонена</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleStatusChange}>Применить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdmissionRequestsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const { data: requestsResponse } = useQuery({
    queryKey: ["admission-requests"],
    queryFn: getAdmissionRequests,
  })

  const requests = requestsResponse?.data ?? []

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAdmissionRequest(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      showSuccessToast("Статус изменён")
    },
    onError: () => showErrorToast("Ошибка при изменении статуса"),
  })

  // Filter by search
  const filteredRequests = useMemo(() => {
    if (!search) return requests
    const q = search.toLowerCase()
    return requests.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone_number.toLowerCase().includes(q) ||
        r.program_interest?.toLowerCase().includes(q)
    )
  }, [search, requests])

  // Group by status
  const requestsByStatus = useMemo(() => {
    return {
      new: filteredRequests.filter((r) => r.status === "new"),
      in_review: filteredRequests.filter((r) => r.status === "in_review"),
      approved: filteredRequests.filter((r) => r.status === "approved"),
      rejected: filteredRequests.filter((r) => r.status === "rejected"),
    }
  }, [filteredRequests])

  const handleStatusChange = (requestId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: requestId, status: newStatus })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <div className="divider-h border-b sticky top-0 bg-background z-40">
        <div className="flex items-center justify-between px-10 py-5 gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-mute" />
            <Input
              placeholder="Поиск по ФИО, телефону, программе..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent text-sm placeholder:text-mute focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <ImportDialog
              trigger={
                <>
                  <Upload className="w-4 h-4" />
                  Импорт
                </>
              }
              title="Импорт заявок"
              description="Загрузите CSV файл с заявками"
              templateColumns={["full_name", "phone_number", "email", "program_interest", "source"]}
              templateColumnLabels={{
                full_name: "ФИО",
                phone_number: "Телефон",
                email: "Email",
                program_interest: "Программа",
                source: "Источник",
              }}
              templateFilename="admission_requests_template.csv"
              onImport={importAdmissionRequestsCSV}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admission-requests"] })}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              Экспорт
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Создать
            </Button>
          </div>
        </div>
      </div>

      {/* Eyebrow */}
      <div className="px-10 py-4">
        <div className="eyebrow">ЗАЯВКИ И ЗАЧИСЛЕНИЕ</div>
      </div>

      {/* Hero */}
      <div className="px-10 py-8">
        <h1 className="display-hero mb-2">
          Заявки — <em className="not-italic text-accent font-medium">{requests.length}</em> в потоке.
        </h1>
        <p className="body-md text-mute max-w-2xl">Управление заявками поступления и зачисления студентов.</p>
      </div>

      {/* Kanban Board */}
      <div className="px-10 py-12">
        <div className="flex gap-6 overflow-x-auto pb-4">
          <KanbanColumn
            status="new"
            title="Новые"
            index={0}
            requests={requestsByStatus.new}
            onStatusChange={handleStatusChange}
          />
          <KanbanColumn
            status="in_review"
            title="На проверке"
            index={1}
            requests={requestsByStatus.in_review}
            onStatusChange={handleStatusChange}
          />
          <KanbanColumn
            status="approved"
            title="Одобрена"
            index={2}
            requests={requestsByStatus.approved}
            onStatusChange={handleStatusChange}
          />
          <KanbanColumn
            status="rejected"
            title="Отклонена"
            index={3}
            requests={requestsByStatus.rejected}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      {/* Dialogs */}
      <CreateRequestDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <ExportPDFDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Заявки на поступление"
        columns={ADMISSION_EXPORT_COLUMNS}
        data={filteredRequests as unknown as Record<string, unknown>[]}
        exportType="admission-requests"
      />
    </div>
  )
}
