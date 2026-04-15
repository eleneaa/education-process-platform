import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Plus, Trash2, Users } from "lucide-react"
import { useState } from "react"

import {
  createEnrollment,
  createGroup,
  deleteEnrollment,
  deleteGroup,
  getEnrollments,
  getGroups,
  getPrograms,
  getUsers,
} from "@/client/custom-api"
import type { Enrollment, Group } from "@/client/custom-types"
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
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/groups")({
  component: GroupsPage,
  head: () => ({
    meta: [{ title: "Группы" }],
  }),
})

function statusLabel(status?: string | null): string {
  const map: Record<string, string> = {
    planned: "Запланирована",
    active: "Активна",
    finished: "Завершена",
    canceled: "Отменена",
  }
  return map[status ?? ""] ?? (status ?? "—")
}

function statusVariant(
  status?: string | null,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active") return "default"
  if (status === "finished") return "outline"
  if (status === "canceled") return "destructive"
  return "secondary"
}

// ─── Create Group Dialog ──────────────────────────────────────────────────────

function CreateGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [name, setName] = useState("")
  const [programId, setProgramId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [status, setStatus] = useState("planned")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    placeholderData: { data: [] as UserPublic[], count: 0 },
  })

  const teachers = (users?.data ?? []).filter(
    (u) => u.is_superuser || u.role === "admin" || u.role === "teacher",
  )

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      showSuccessToast("Группа создана")
      onOpenChange(false)
      setName("")
      setProgramId("")
      setTeacherId("")
      setStatus("planned")
      setStartDate("")
      setEndDate("")
    },
    onError: () => {
      showErrorToast("Не удалось создать группу")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !programId) return
    mutation.mutate({
      name: name.trim(),
      program_id: programId,
      teacher_id: teacherId || undefined,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создать группу</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grp-name">Название *</Label>
            <Input
              id="grp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название группы"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grp-program">Программа *</Label>
            <Select value={programId} onValueChange={setProgramId} required>
              <SelectTrigger id="grp-program">
                <SelectValue placeholder="Выберите программу" />
              </SelectTrigger>
              <SelectContent>
                {(programs?.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grp-teacher">Преподаватель</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger id="grp-teacher">
                <SelectValue placeholder="Выберите преподавателя" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Не назначен —</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name || t.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grp-status">Статус</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="grp-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Запланирована</SelectItem>
                <SelectItem value="active">Активна</SelectItem>
                <SelectItem value="finished">Завершена</SelectItem>
                <SelectItem value="canceled">Отменена</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="grp-start">Дата начала</Label>
              <Input
                id="grp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grp-end">Дата окончания</Label>
              <Input
                id="grp-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending || !programId}>
              {mutation.isPending ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Manage Students Dialog ───────────────────────────────────────────────────

function EnrollmentRow({
  enrollment,
  onDeleted,
}: {
  enrollment: Enrollment
  onDeleted: () => void
}) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: () => deleteEnrollment(enrollment.id),
    onSuccess: () => { showSuccessToast("Студент удалён из группы"); onDeleted() },
    onError: () => showErrorToast("Не удалось удалить"),
  })

  return (
    <>
      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Удалить студента из группы?"
        description={`${enrollment.student_name ?? enrollment.student_email ?? "Студент"} будет отчислен из группы.`}
        onConfirm={() => mutation.mutate()}
        isPending={mutation.isPending}
      />
      <div className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{enrollment.student_name ?? enrollment.student_email ?? enrollment.student_id}</p>
          {enrollment.student_name && enrollment.student_email && (
            <p className="text-xs text-muted-foreground truncate">{enrollment.student_email}</p>
          )}
        </div>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive shrink-0" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </>
  )
}

function ManageStudentsDialog({
  open,
  onOpenChange,
  group,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [selectedUserId, setSelectedUserId] = useState("")

  const { data: enrollmentsData } = useQuery({
    queryKey: ["enrollments", "group", group.id],
    queryFn: () => getEnrollments(undefined, group.id),
    enabled: open,
    placeholderData: { data: [], count: 0 },
  })

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    placeholderData: { data: [] as UserPublic[], count: 0 },
  })

  const enrolledIds = new Set((enrollmentsData?.data ?? []).map((e) => e.student_id))
  const availableStudents = (usersData?.data ?? []).filter(
    (u) => !enrolledIds.has(u.id) && (u.role === "student" || (!u.is_superuser && u.role !== "admin" && u.role !== "teacher")),
  )

  const mutation = useMutation({
    mutationFn: (studentId: string) =>
      createEnrollment({ student_id: studentId, group_id: group.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", "group", group.id] })
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      showSuccessToast("Студент добавлен в группу")
      setSelectedUserId("")
    },
    onError: () => {
      showErrorToast("Не удалось добавить студента")
    },
  })

  const enrollments = enrollmentsData?.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Студенты — {group.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Enrolled students list */}
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                В группе пока нет студентов
              </p>
            ) : (
              enrollments.map((e) => (
                <EnrollmentRow
                  key={e.id}
                  enrollment={e}
                  onDeleted={() => {
                    queryClient.invalidateQueries({ queryKey: ["enrollments", "group", group.id] })
                    queryClient.invalidateQueries({ queryKey: ["groups"] })
                  }}
                />
              ))
            )}
          </div>

          {/* Add student */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Добавить студента</p>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Выберите студента" />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.length === 0 ? (
                    <SelectItem value="_empty" disabled>
                      Все студенты уже в группе
                    </SelectItem>
                  ) : (
                    availableStudents.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                onClick={() => selectedUserId && mutation.mutate(selectedUserId)}
                disabled={!selectedUserId || mutation.isPending}
              >
                Добавить
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function GroupsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [studentsGroup, setStudentsGroup] = useState<Group | null>(null)
  const [deleteGroup_, setDeleteGroup] = useState<Group | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      showSuccessToast("Группа удалена")
      setDeleteGroup(null)
    },
    onError: () => showErrorToast("Не удалось удалить группу"),
  })

  const { data: groups, isError } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    placeholderData: { data: [], count: 0 },
  })
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })

  const role = (user?.role ?? "student").toLowerCase()
  const canManage =
    user?.is_superuser || role === "admin" || role === "teacher"

  const programMap = Object.fromEntries(
    (programs?.data ?? []).map((p) => [p.id, p.title]),
  )

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки групп</p>
  }

  const groupList = groups?.data ?? []

  return (
    <div className="space-y-6">
      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDeleteDialog
        open={!!deleteGroup_}
        onOpenChange={(o) => !o && setDeleteGroup(null)}
        title="Удалить группу?"
        description={`Группа «${deleteGroup_?.name}» и все зачисления будут удалены безвозвратно.`}
        onConfirm={() => deleteGroup_ && deleteMutation.mutate(deleteGroup_.id)}
        isPending={deleteMutation.isPending}
      />
      {studentsGroup && (
        <ManageStudentsDialog
          open={!!studentsGroup}
          onOpenChange={(o) => !o && setStudentsGroup(null)}
          group={studentsGroup}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Группы</h1>
          <p className="text-muted-foreground">Учебные группы</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать группу
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Программа</TableHead>
                <TableHead>Преподаватель</TableHead>
                <TableHead>Студентов</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата начала</TableHead>
                <TableHead>Дата окончания</TableHead>
                {canManage && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 8 : 7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Групп пока нет
                  </TableCell>
                </TableRow>
              ) : (
                groupList.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {programMap[g.program_id] ?? g.program_id}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {g.teacher_name ?? g.teacher_id ?? "—"}
                    </TableCell>
                    <TableCell>{g.student_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(g.status)}>
                        {statusLabel(g.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {g.start_date
                        ? new Date(g.start_date).toLocaleDateString("ru-RU")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {g.end_date
                        ? new Date(g.end_date).toLocaleDateString("ru-RU")
                        : "—"}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setStudentsGroup(g)}>
                            <Users className="h-3.5 w-3.5 mr-1" />
                            Студенты
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteGroup(g)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
