import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UsersService } from "@/client"
import { createFileRoute } from "@tanstack/react-router"
import { Check, ClipboardCopy, Pencil, Plus, Search, UserPlus } from "lucide-react"
import { useState } from "react"

import {
  createAdmissionRequest,
  getAdmissionRequests,
  getUsers,
  updateAdmissionRequest,
} from "@/client/custom-api"
import type { AdmissionRequest } from "@/client/custom-types"
import type { UserPublic } from "@/client/types.gen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/admission-requests")({
  component: AdmissionRequestsPage,
  head: () => ({
    meta: [{ title: "Заявки" }],
  }),
})

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_review: "В рассмотрении",
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

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "new") return "secondary"
  if (s === "in_review") return "default"
  if (s === "approved") return "outline"
  if (s === "rejected") return "destructive"
  return "secondary"
}

function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// ─── Create Request Dialog ────────────────────────────────────────────────────

function CreateRequestDialog({
  open,
  onOpenChange,
  managers,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  managers: UserPublic[]
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [programInterest, setProgramInterest] = useState("")
  const [comment, setComment] = useState("")
  const [source, setSource] = useState("website")
  const [assignedToId, setAssignedToId] = useState("")

  const mutation = useMutation({
    mutationFn: async (body: Parameters<typeof createAdmissionRequest>[0]) => {
      const req = await createAdmissionRequest(body)
      if (assignedToId) {
        await updateAdmissionRequest(req.id, { assigned_to_id: assignedToId, status: "in_review" })
      }
      return req
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      showSuccessToast("Заявка создана")
      onOpenChange(false)
      setFullName(""); setEmail(""); setPhone(""); setProgramInterest(""); setComment("")
      setSource("website"); setAssignedToId("")
    },
    onError: () => showErrorToast("Не удалось создать заявку"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) return
    mutation.mutate({
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone_number: phone.trim(),
      program_interest: programInterest.trim() || null,
      comment: comment.trim() || null,
      source,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Новая заявка</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>ФИО *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Телефон *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 000-00-00" required />
            </div>
            <div className="space-y-1.5">
              <Label>Источник</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ответственный</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger><SelectValue placeholder="Не назначен" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Не назначен —</SelectItem>
                  {managers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Интерес к программе</Label>
              <Input value={programInterest} onChange={(e) => setProgramInterest(e.target.value)} placeholder="Название программы" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Комментарий</Label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Дополнительные заметки..."
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Request Dialog ──────────────────────────────────────────────────────

function EditRequestDialog({
  open,
  onOpenChange,
  request,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  request: AdmissionRequest
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [fullName, setFullName] = useState(request.full_name)
  const [email, setEmail] = useState(request.email ?? "")
  const [phone, setPhone] = useState(request.phone_number)
  const [programInterest, setProgramInterest] = useState(request.program_interest ?? "")
  const [comment, setComment] = useState(request.comment ?? "")
  const [source, setSource] = useState(request.source)

  const mutation = useMutation({
    mutationFn: () =>
      updateAdmissionRequest(request.id, {
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone_number: phone.trim(),
        program_interest: programInterest.trim() || null,
        comment: comment.trim() || null,
        source,
      } as Parameters<typeof updateAdmissionRequest>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      showSuccessToast("Заявка обновлена")
      onOpenChange(false)
    },
    onError: () => showErrorToast("Не удалось сохранить"),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) return
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Редактировать заявку</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>ФИО *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Телефон *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Источник</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Интерес к программе</Label>
              <Input value={programInterest} onChange={(e) => setProgramInterest(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Комментарий</Label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
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

// ─── Create Account Dialog ────────────────────────────────────────────────────

function CreateAccountDialog({
  open,
  onOpenChange,
  request,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  request: AdmissionRequest
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [password] = useState(() => generatePassword())
  const [copied, setCopied] = useState(false)
  const [created, setCreated] = useState(false)

  const message = `Здравствуйте, ${request.full_name}!

Ваша заявка одобрена. Для вас создан личный кабинет на нашей платформе.

Данные для входа:
🔗 Ссылка: ${window.location.origin}
📧 Email: ${request.email ?? "—"}
🔑 Пароль: ${password}

Рекомендуем сменить пароль после первого входа.`

  const mutation = useMutation({
    mutationFn: () =>
      UsersService.createUser({
        requestBody: {
          email: request.email!,
          full_name: request.full_name,
          password,
          is_active: true,
          is_superuser: false,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setCreated(true)
      showSuccessToast("Аккаунт создан")
    },
    onError: () => showErrorToast("Не удалось создать аккаунт"),
  })

  function handleCopy() {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Создать аккаунт — {request.full_name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{request.email ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Пароль:</span> <span className="font-mono font-medium">{password}</span></div>
          </div>

          {!request.email && (
            <p className="text-sm text-destructive">У заявки нет email — аккаунт создать нельзя.</p>
          )}

          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Скриптовое сообщение</p>
            <pre className="text-sm whitespace-pre-wrap font-sans">{message}</pre>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <ClipboardCopy className="h-4 w-4 mr-2" />}
              {copied ? "Скопировано!" : "Скопировать сообщение"}
            </Button>
            {request.email && !created && (
              <Button
                className="flex-1"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {mutation.isPending ? "Создание..." : "Создать аккаунт"}
              </Button>
            )}
            {created && (
              <Button variant="outline" className="flex-1" disabled>
                <Check className="h-4 w-4 mr-2 text-green-500" />
                Аккаунт создан
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function RequestRow({
  req,
  managers,
  canManage,
}: {
  req: AdmissionRequest
  managers: UserPublic[]
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [accountOpen, setAccountOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (body: { status?: string; assigned_to_id?: string | null }) =>
      updateAdmissionRequest(req.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
      showSuccessToast("Заявка обновлена")
    },
    onError: () => showErrorToast("Ошибка обновления"),
  })

  return (
    <>
      {accountOpen && (
        <CreateAccountDialog open={accountOpen} onOpenChange={setAccountOpen} request={req} />
      )}
      {editOpen && (
        <EditRequestDialog open={editOpen} onOpenChange={setEditOpen} request={req} />
      )}
      <TableRow>
        <TableCell className="font-medium">{req.full_name}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{req.email ?? "—"}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{req.phone_number}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {SOURCE_LABELS[req.source] ?? req.source}
        </TableCell>
        {/* Ответственный — inline select для менеджеров */}
        <TableCell>
          {canManage ? (
            <Select
              value={req.assigned_to_id ?? "_none"}
              onValueChange={(v) =>
                updateMutation.mutate({ assigned_to_id: v === "_none" ? null : v })
              }
            >
              <SelectTrigger className="h-7 w-40 text-xs">
                <SelectValue placeholder="Не назначен" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Не назначен —</SelectItem>
                {managers.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">{req.assigned_to_name ?? "—"}</span>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {req.created_at ? new Date(req.created_at).toLocaleDateString("ru-RU") : "—"}
        </TableCell>
        <TableCell>
          {canManage ? (
            <Select
              value={req.status}
              onValueChange={(v) => updateMutation.mutate({ status: v })}
            >
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={statusVariant(req.status)}>{STATUS_LABELS[req.status] ?? req.status}</Badge>
          )}
        </TableCell>
        {canManage && (
          <TableCell>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {req.status === "approved" && (
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => setAccountOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function AdmissionRequestsPage() {
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")

  const { data: allRequests, isError } = useQuery({
    queryKey: ["admission-requests"],
    queryFn: () => getAdmissionRequests(),
    placeholderData: { data: [], count: 0 },
  })

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    placeholderData: { data: [] as UserPublic[], count: 0 },
  })

  const role = (user?.role ?? "student").toLowerCase()
  const canManage = user?.is_superuser || role === "admin" || role === "teacher"

  const managers = (usersData?.data ?? []).filter(
    (u) => u.is_superuser || u.role === "admin" || u.role === "teacher",
  )

  if (isError) return <p className="text-destructive">Ошибка загрузки заявок</p>

  const allList = allRequests?.data ?? []
  const filtered = allList.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      r.full_name.toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      r.phone_number.includes(q)
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const counts = {
    all: allList.length,
    new: allList.filter((r) => r.status === "new").length,
    in_review: allList.filter((r) => r.status === "in_review").length,
    approved: allList.filter((r) => r.status === "approved").length,
    rejected: allList.filter((r) => r.status === "rejected").length,
  }

  const STATUS_FILTERS = [
    { value: "all", label: "Все", count: counts.all },
    { value: "new", label: "Новые", count: counts.new },
    { value: "in_review", label: "В рассмотрении", count: counts.in_review },
    { value: "approved", label: "Одобрены", count: counts.approved },
    { value: "rejected", label: "Отклонены", count: counts.rejected },
  ]

  return (
    <div className="space-y-6">
      <CreateRequestDialog open={createOpen} onOpenChange={setCreateOpen} managers={managers} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Заявки</h1>
          <p className="text-muted-foreground">Управление заявками на поступление</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить заявку
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по ФИО, email, телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={statusFilter === f.value ? "default" : "outline"}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
            {f.count > 0 && (
              <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">
                {f.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                {canManage && <TableHead>Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    Заявок нет
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((req) => (
                  <RequestRow key={req.id} req={req} managers={managers} canManage={canManage} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
