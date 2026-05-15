import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FileDown, Plus, Search, Upload, MoreVertical, Copy, Check, AlertCircle } from "lucide-react"
import { useState, useMemo } from "react"

import {
  createAdmissionRequest,
  getAdmissionRequests,
  updateAdmissionRequest,
  importAdmissionRequestsCSV,
  createUserFromAdmission,
  approveAdmissionRequest,
  getGroups,
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
  user_created: "Аккаунт создан",
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

// ─── Details Dialog ────────────────────────────────────────────────────────

function DetailsDialog({
  open,
  onOpenChange,
  request,
  onSave,
  isSaving,
  onApproveClick,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  request?: AdmissionRequest
  onSave: (data: any) => void
  isSaving: boolean
  onApproveClick?: () => void
}) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    program_interest: "",
    comment: "",
    source: "website",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update formData when request changes
  useMemo(() => {
    if (request) {
      setFormData({
        full_name: request.full_name || "",
        email: request.email || "",
        phone_number: request.phone_number || "",
        program_interest: request.program_interest || "",
        comment: request.comment || "",
        source: request.source || "website",
      })
      setErrors({})
    }
  }, [request?.id, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.full_name.trim()) newErrors.full_name = "ФИО обязательно"
    if (!formData.phone_number.trim()) newErrors.phone_number = "Телефон обязателен"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Некорректный email"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
    }
  }

  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детали заявки</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className={`text-sm font-medium ${errors.full_name ? "text-red-500" : ""}`}>ФИО</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value })
                if (errors.full_name) setErrors({ ...errors, full_name: "" })
              }}
              className={`mt-1 ${errors.full_name ? "border-red-500 focus:ring-red-500" : ""}`}
            />
            {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <Label className={`text-sm font-medium ${errors.email ? "text-red-500" : ""}`}>Email</Label>
            <Input
              type="email"
              value={formData.email || ""}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (errors.email) setErrors({ ...errors, email: "" })
              }}
              className={`mt-1 ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label className={`text-sm font-medium ${errors.phone_number ? "text-red-500" : ""}`}>Телефон</Label>
            <Input
              value={formData.phone_number}
              onChange={(e) => {
                setFormData({ ...formData, phone_number: e.target.value })
                if (errors.phone_number) setErrors({ ...errors, phone_number: "" })
              }}
              className={`mt-1 ${errors.phone_number ? "border-red-500 focus:ring-red-500" : ""}`}
            />
            {errors.phone_number && <p className="text-xs text-red-500 mt-1">{errors.phone_number}</p>}
          </div>
          <div>
            <Label className="text-sm font-medium">Интерес к программе</Label>
            <Input
              value={formData.program_interest || ""}
              onChange={(e) => setFormData({ ...formData, program_interest: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Источник</Label>
            <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
              <SelectTrigger className="mt-1">
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
          <div>
            <Label className="text-sm font-medium">Комментарий</Label>
            <Input
              value={formData.comment || ""}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="mt-1"
              placeholder="Внутренний комментарий"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          {request?.status && ["new", "in_review"].includes(request.status) && onApproveClick && (
            <Button variant="accent" onClick={onApproveClick}>
              Одобрить
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Create User Dialog ─────────────────────────────────────────────────────

function CreateUserDialog({
  open,
  onOpenChange,
  email,
  password,
  fullName,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  email?: string
  password?: string
  fullName?: string
}) {
  const [copied, setCopied] = useState(false)

  const scriptMessage = `Для входа в систему используйте:
Email: ${email || "—"}
Пароль: ${password || "—"}

Пожалуйста, измените пароль при первом входе.`

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Аккаунт создан — {fullName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <div className="mt-1 p-3 bg-surface-1 rounded border border-hair text-sm mono">
              {email}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Временный пароль</Label>
            <div className="mt-1 p-3 bg-surface-1 rounded border border-hair text-sm mono">
              {password}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Сообщение студенту</Label>
            <div className="mt-1 p-3 bg-surface-1 rounded border border-hair text-sm whitespace-pre-wrap">
              {scriptMessage}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button onClick={handleCopy} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Скопировано" : "Скопировать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Create Request Dialog ──────────────────────────────────────────────────

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
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      setErrors({})
    },
    onError: () => showErrorToast("Ошибка при создании заявки"),
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!fullName.trim()) newErrors.fullName = "ФИО обязательно"
    if (!phone.trim()) newErrors.phone = "Телефон обязателен"
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Некорректный email"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return
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
            <Label htmlFor="name" className={`text-sm font-medium ${errors.fullName ? "text-red-500" : ""}`}>
              ФИО *
            </Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (errors.fullName) setErrors({ ...errors, fullName: "" })
              }}
              placeholder="Иванов Иван"
              className={`mt-1 ${errors.fullName ? "border-red-500 focus:ring-red-500" : ""}`}
              required
            />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
          </div>
          <div>
            <Label htmlFor="phone" className={`text-sm font-medium ${errors.phone ? "text-red-500" : ""}`}>
              Телефон *
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                if (errors.phone) setErrors({ ...errors, phone: "" })
              }}
              placeholder="+7 (999) 000-00-00"
              className={`mt-1 ${errors.phone ? "border-red-500 focus:ring-red-500" : ""}`}
              required
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <Label htmlFor="email" className={`text-sm font-medium ${errors.email ? "text-red-500" : ""}`}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors({ ...errors, email: "" })
              }}
              placeholder="example@mail.com"
              className={`mt-1 ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setErrors({})
              }}
            >
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

// ─── Approval Dialog ──────────────────────────────────────────────────────────

function ApprovalDialog({
  open,
  onOpenChange,
  request,
  onApprove,
  isApproving,
  groups,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  request?: AdmissionRequest
  onApprove: (groupId: string) => void
  isApproving: boolean
  groups: Array<{ id: string; name: string }>
}) {
  const [selectedGroupId, setSelectedGroupId] = useState("")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Одобрить заявку — {request?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="group" className="text-sm font-medium">
              Выберите группу *
            </Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="mt-1" id="group">
                <SelectValue placeholder="Выберите группу..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => {
              if (selectedGroupId) {
                onApprove(selectedGroupId)
              }
            }}
            disabled={!selectedGroupId || isApproving}
          >
            {isApproving ? "Одобрение..." : "Одобрить и зачислить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Kanban Column ─────────────────────────────────────────────────────────

interface KanbanColumnProps {
  status: string
  title: string
  index: number
  requests: AdmissionRequest[]
  onStatusChange: (requestId: string, newStatus: string) => void
  onAssignedToChange: (requestId: string, adminId: string | null) => void
  onCreateUser: (requestId: string) => void
  onOpenDetails: (request: AdmissionRequest) => void
  admins: Array<{ id: string; email: string; full_name: string | null }>
  isLoading?: boolean
}

function KanbanColumn({
  status,
  title,
  index,
  requests,
  onStatusChange,
  onAssignedToChange,
  onCreateUser,
  onOpenDetails,
  admins,
  isLoading = false,
}: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData("requestId")
    if (draggedId) {
      onStatusChange(draggedId, status)
    }
  }

  return (
    <div
      className="flex flex-col flex-1 min-w-80"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-hair">
        <span className="label-sm text-mute">0{index + 1} ЭТАП</span>
        <h3 className="heading-sm text-fg flex-1">{title}</h3>
        <span className="mono text-sm font-medium text-accent">{requests.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 flex-1">
        {isLoading && (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-surface-2 rounded-2xl animate-pulse border border-hair" />
            ))}
          </>
        )}
        {!isLoading &&
          requests.map((req) => (
            <Card
              key={req.id}
              className="border-hair rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-move hover:bg-surface-1"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("requestId", req.id)}
              onClick={() => onOpenDetails(req)}
            >
              {/* Header: ID + Date */}
              <div className="flex items-start justify-between gap-2">
                <span className="mono text-xs text-mute">#{req.id.slice(0, 8)}</span>
                <span className="mono text-xs text-mute">
                  {req.created_at
                    ? new Date(req.created_at).toLocaleDateString("ru-RU", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>

              {/* Name */}
              <div>
                <p className="body-sm text-fg font-medium">{req.full_name}</p>
              </div>

              {/* Program Interest */}
              {req.program_interest && <p className="body-xs text-mute line-clamp-1">{req.program_interest}</p>}

              {/* Admin assignment (in_review status) */}
              {status === "in_review" && (
                <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                  <Label className="text-xs font-medium">Ответственный</Label>
                  <Select
                    value={req.assigned_to_id || "_none"}
                    onValueChange={(value) => onAssignedToChange(req.id, value === "_none" ? null : value)}
                  >
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue placeholder="Выберите..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Не назначен</SelectItem>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.full_name || admin.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Create user button (approved status only, not user_created) */}
              {status === "approved" && (
                <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => onCreateUser(req.id)}
                  >
                    Создать аккаунт
                  </Button>
                </div>
              )}

              {/* Footer: Source */}
              <div className="flex items-center justify-between pt-2 border-t border-hair">
                <span className="label-sm text-mute">{SOURCE_LABELS[req.source] || req.source}</span>
                <span className="label-sm text-mute text-xs">⋮⋮⋮ перетащи</span>
              </div>
            </Card>
          ))}
        {!isLoading && requests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[300px] rounded-lg border border-dashed border-border bg-surface-secondary opacity-50">
            <div className="w-12 h-12 rounded-full bg-mute/10 flex items-center justify-center mb-3">
              <FileDown className="w-6 h-6 text-mute" />
            </div>
            <p className="label-sm text-mute">Нет заявок</p>
            <p className="text-xs text-mute/70 mt-1">В этой колонке пока нет заявок</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

function AdmissionRequestsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false)
  const [createdUserData, setCreatedUserData] = useState<{
    email?: string
    password?: string
    fullName?: string
  }>({})
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AdmissionRequest | undefined>()
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [requestToApprove, setRequestToApprove] = useState<AdmissionRequest | undefined>()

  const { data: requestsResponse, isLoading } = useQuery({
    queryKey: ["admission-requests"],
    queryFn: getAdmissionRequests,
  })

  const { data: adminsResponse } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/v1/users/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      })
      return response.json()
    },
  })

  const { data: groupsResponse } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  })

  const requests = requestsResponse?.data ?? []
  const admins = (adminsResponse?.data ?? []).filter((u: any) => u.role === "ADMIN")

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAdmissionRequest(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      showSuccessToast("Статус изменён")
    },
    onError: () => showErrorToast("Ошибка при изменении статуса"),
  })

  const updateAssignedToMutation = useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string | null }) =>
      updateAdmissionRequest(id, { assigned_to_id: assignedToId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      showSuccessToast("Ответственный назначен")
    },
    onError: () => showErrorToast("Ошибка при назначении ответственного"),
  })

  const createUserMutation = useMutation({
    mutationFn: createUserFromAdmission,
    onSuccess: (data) => {
      setCreatedUserData({
        email: data.email,
        password: data.password,
        fullName: data.full_name,
      })
      setCreateUserDialogOpen(true)
      showSuccessToast("Аккаунт создан! Карточка перенесена в 'Аккаунт создан'")
      // Invalidate and refetch to move card to user_created column
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      }, 500)
    },
    onError: () => {
      showErrorToast("Ошибка при создании аккаунта")
    },
  })

  const saveDetailsMutation = useMutation({
    mutationFn: (data: any) =>
      updateAdmissionRequest(selectedRequest!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      setDetailsDialogOpen(false)
      showSuccessToast("Заявка обновлена")
    },
    onError: () => showErrorToast("Ошибка при сохранении"),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string }) =>
      approveAdmissionRequest(id, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      setApprovalDialogOpen(false)
      setRequestToApprove(undefined)
      showSuccessToast("Заявка одобрена и студент зачислен в группу")
    },
    onError: () => showErrorToast("Ошибка при одобрении заявки"),
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
      user_created: filteredRequests.filter((r) => r.status === "user_created"),
      rejected: filteredRequests.filter((r) => r.status === "rejected"),
    }
  }, [filteredRequests])

  const handleStatusChange = (requestId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: requestId, status: newStatus })
  }

  const handleAssignedToChange = (requestId: string, adminId: string | null) => {
    updateAssignedToMutation.mutate({ id: requestId, assignedToId: adminId })
  }

  const handleCreateUser = (requestId: string) => {
    createUserMutation.mutate(requestId)
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
            onAssignedToChange={handleAssignedToChange}
            onCreateUser={handleCreateUser}
            onOpenDetails={(req) => {
              setSelectedRequest(req)
              setDetailsDialogOpen(true)
            }}
            admins={admins}
            isLoading={isLoading}
          />
          <KanbanColumn
            status="in_review"
            title="На проверке"
            index={1}
            requests={requestsByStatus.in_review}
            onStatusChange={handleStatusChange}
            onAssignedToChange={handleAssignedToChange}
            onCreateUser={handleCreateUser}
            onOpenDetails={(req) => {
              setSelectedRequest(req)
              setDetailsDialogOpen(true)
            }}
            admins={admins}
            isLoading={isLoading}
          />
          <KanbanColumn
            status="approved"
            title="Одобрена"
            index={2}
            requests={requestsByStatus.approved}
            onStatusChange={handleStatusChange}
            onAssignedToChange={handleAssignedToChange}
            onCreateUser={handleCreateUser}
            onOpenDetails={(req) => {
              setSelectedRequest(req)
              setDetailsDialogOpen(true)
            }}
            admins={admins}
            isLoading={isLoading}
          />
          <KanbanColumn
            status="user_created"
            title="Аккаунт создан"
            index={3}
            requests={requestsByStatus.user_created}
            onStatusChange={handleStatusChange}
            onAssignedToChange={handleAssignedToChange}
            onCreateUser={handleCreateUser}
            onOpenDetails={(req) => {
              setSelectedRequest(req)
              setDetailsDialogOpen(true)
            }}
            admins={admins}
            isLoading={isLoading}
          />
          <KanbanColumn
            status="rejected"
            title="Отклонена"
            index={4}
            requests={requestsByStatus.rejected}
            onStatusChange={handleStatusChange}
            onAssignedToChange={handleAssignedToChange}
            onCreateUser={handleCreateUser}
            onOpenDetails={(req) => {
              setSelectedRequest(req)
              setDetailsDialogOpen(true)
            }}
            admins={admins}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Dialogs */}
      <CreateRequestDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <DetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        request={selectedRequest}
        onSave={(data) => saveDetailsMutation.mutate(data)}
        isSaving={saveDetailsMutation.isPending}
        onApproveClick={() => {
          if (selectedRequest) {
            setRequestToApprove(selectedRequest)
            setApprovalDialogOpen(true)
            setDetailsDialogOpen(false)
          }
        }}
      />

      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        request={requestToApprove}
        onApprove={(groupId) => {
          if (requestToApprove) {
            approveMutation.mutate({ id: requestToApprove.id, groupId })
          }
        }}
        isApproving={approveMutation.isPending}
        groups={groupsResponse?.data ?? []}
      />

      <CreateUserDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
        email={createdUserData.email}
        password={createdUserData.password}
        fullName={createdUserData.fullName}
      />

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
