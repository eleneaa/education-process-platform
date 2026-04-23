import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Users,
  Pencil,
  Plus,
  Search,
  Trash2,
  BookOpen,
  Grid,
  List as ListIcon,
  UserPlus,
  UserMinus,
  MessageSquare,
} from "lucide-react"
import { useState } from "react"

import {
  createGroup,
  createEnrollment,
  deleteGroup,
  deleteEnrollment,
  getGroups,
  getEnrollments,
  getPrograms,
  getUsers,
  updateGroup,
  createRecommendation,
} from "@/client/custom-api"
import type { Group, Enrollment, Program } from "@/client/custom-types"
import type { UserPublic } from "@/client/types.gen"
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

export const Route = createFileRoute("/_layout/groups")({
  component: GroupsPage,
  head: () => ({
    meta: [{ title: "Группы" }],
  }),
})

// ─── Group Form ──────────────────────────────────────────────────────────────

function GroupForm({
  group,
  programs,
  teachers,
  onSubmit,
  onCancel,
  isLoading,
}: {
  group?: Group
  programs: Program[]
  teachers: UserPublic[]
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const isEdit = !!group
  const [name, setName] = useState(group?.name ?? "")
  const [programId, setProgramId] = useState(group?.program_id ?? "")
  const [teacherId, setTeacherId] = useState(group?.teacher_id ?? "")
  const [status, setStatus] = useState(group?.status ?? "active")
  const [startDate, setStartDate] = useState(group?.start_date ?? "")
  const [endDate, setEndDate] = useState(group?.end_date ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !programId) return
    onSubmit({
      name: name.trim(),
      program_id: programId,
      teacher_id: teacherId || undefined,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="group-name" className="text-base font-semibold">
          Название группы
        </Label>
        <Input
          id="group-name"
          placeholder="Введите название группы"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="program" className="text-base font-semibold">
          Программа обучения
        </Label>
        {programs.length > 0 ? (
          <Select value={programId} onValueChange={setProgramId} disabled={isLoading}>
            <SelectTrigger id="program" className="mt-2">
              <SelectValue placeholder="Выберите программу" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="mt-2 p-2 text-sm text-destructive bg-destructive/10 rounded-md">
            Нет доступных программ обучения
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="teacher" className="text-base font-semibold">
          Преподаватель
        </Label>
        <Select value={teacherId} onValueChange={setTeacherId} disabled={isLoading || teachers.length === 0}>
          <SelectTrigger id="teacher" className="mt-2">
            <SelectValue placeholder={teachers.length > 0 ? "Выберите преподавателя (опционально)" : "Нет доступных преподавателей"} />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.full_name || t.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date" className="text-base font-semibold">
            Начало
          </Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-2"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="end-date" className="text-base font-semibold">
            Конец
          </Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-2"
            disabled={isLoading}
          />
        </div>
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
            <SelectItem value="active">Активна</SelectItem>
            <SelectItem value="completed">Завершена</SelectItem>
            <SelectItem value="archived">Архивирована</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isLoading || !name.trim() || !programId}
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

// ─── Add Student Form ─────────────────────────────────────────────────────────

function AddStudentForm({
  students,
  enrolledStudentIds,
  onSubmit,
  onCancel,
  isLoading,
}: {
  students: UserPublic[]
  enrolledStudentIds: Set<string>
  onSubmit: (studentId: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [selectedStudentId, setSelectedStudentId] = useState("")

  const availableStudents = students.filter((s) => !enrolledStudentIds.has(s.id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return
    onSubmit(selectedStudentId)
    setSelectedStudentId("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="student" className="text-base font-semibold">
          Выберите студента
        </Label>
        <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={isLoading}>
          <SelectTrigger id="student" className="mt-2">
            <SelectValue placeholder="Доступные студенты" />
          </SelectTrigger>
          <SelectContent>
            {availableStudents.length > 0 ? (
              availableStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name || s.email}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">Нет доступных студентов</div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isLoading || !selectedStudentId}
          className="flex-1 gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Добавить
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

// ─── Group Card ──────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: Group
  studentCount: number
  programTitle?: string
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
  onManageStudents: (group: Group) => void
}

function GroupCard({
  group,
  studentCount,
  programTitle,
  onEdit,
  onDelete,
  onManageStudents,
}: GroupCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    completed: "secondary",
    archived: "outline",
  }

  const statusLabel = {
    active: "Активна",
    completed: "Завершена",
    archived: "Архивирована",
  }

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate">
                {group.name}
              </h3>
              {programTitle && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {programTitle}
                </p>
              )}
              {group.teacher_name && (
                <p className="text-sm text-muted-foreground mt-1">
                  Преподаватель: {group.teacher_name}
                </p>
              )}
            </div>
            <Users className="h-6 w-6 text-primary/40 shrink-0" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant={statusColor[group.status || "active"] as any}>
              {statusLabel[group.status as keyof typeof statusLabel] || group.status}
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {studentCount} студентов
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onManageStudents(group)}
              className="flex-1 text-xs"
            >
              <Users className="h-4 w-4 mr-2" />
              Студенты
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(group)}
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
        onConfirm={() => onDelete(group)}
        title="Удалить группу?"
        description={`Вы уверены, что хотите удалить группу "${group.name}"? Это действие необратимо.`}
      />
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function GroupsPage() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")

  // Group form state
  const [groupFormOpen, setGroupFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | undefined>()

  // Student management state
  const [managingGroup, setManagingGroup] = useState<Group | undefined>()
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [recommendationOpen, setRecommendationOpen] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | undefined>()

  // Queries
  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroups(),
    select: (data) => data.data ?? [],
  })

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => getEnrollments(),
    select: (data) => data.data ?? [],
  })

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(),
    select: (data) => data.data ?? [],
  })

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
    select: (data) => data.data ?? [],
  })

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      showSuccessToast("Группа создана")
      setGroupFormOpen(false)
    },
    onError: () => showErrorToast("Ошибка при создании группы"),
  })

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      showSuccessToast("Группа обновлена")
      setGroupFormOpen(false)
      setEditingGroup(undefined)
    },
    onError: () => showErrorToast("Ошибка при обновлении группы"),
  })

  const deleteGroupMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      showSuccessToast("Группа удалена")
    },
    onError: () => showErrorToast("Ошибка при удалении группы"),
  })

  const createEnrollmentMutation = useMutation({
    mutationFn: createEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      showSuccessToast("Студент добавлен")
      setAddStudentOpen(false)
    },
    onError: () => showErrorToast("Ошибка при добавлении студента"),
  })

  const deleteEnrollmentMutation = useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] })
      showSuccessToast("Студент удален")
    },
    onError: () => showErrorToast("Ошибка при удалении студента"),
  })

  const recommendMutation = useMutation({
    mutationFn: (data: any) => createRecommendation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-recommendations"] })
      showSuccessToast("Рекомендация отправлена")
      setRecommendationOpen(false)
    },
    onError: () => showErrorToast("Ошибка при отправке рекомендации"),
  })

  const handleCreateGroup = () => {
    setEditingGroup(undefined)
    setGroupFormOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group)
    setGroupFormOpen(true)
  }

  const handleSubmitGroupForm = (data: any) => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data })
    } else {
      createGroupMutation.mutate(data)
    }
  }

  const handleManageStudents = (group: Group) => {
    setManagingGroup(group)
  }

  const handleAddStudent = (studentId: string) => {
    if (!managingGroup) return
    createEnrollmentMutation.mutate({
      student_id: studentId,
      group_id: managingGroup.id,
    })
  }

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getGroupStudents = (groupId: string) =>
    enrollments.filter((e) => e.group_id === groupId)

  const getProgramTitle = (programId: string) =>
    programs.find((p) => p.id === programId)?.title

  const getStudent = (studentId: string) =>
    users.find((u) => u.id === studentId)

  const teachers = users.filter((u) => u.role === "TEACHER")

  const groupEnrollmentIds = managingGroup
    ? new Set(getGroupStudents(managingGroup.id).map((e) => e.student_id))
    : new Set<string>()

  return (
    <div className="flex flex-col h-full gap-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Группы обучения</h1>
          <p className="text-muted-foreground mt-2">
            Всего групп: {filteredGroups.length}
          </p>
        </div>
        <Button
          onClick={handleCreateGroup}
          size="lg"
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Создать группу
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск групп..."
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

      {/* Groups Grid/List */}
      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max"
            : "space-y-3"
        }
      >
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              studentCount={getGroupStudents(group.id).length}
              programTitle={getProgramTitle(group.program_id)}
              onEdit={handleEditGroup}
              onDelete={(g) => deleteGroupMutation.mutate(g.id)}
              onManageStudents={handleManageStudents}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-semibold text-foreground">Нет групп</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Создайте первую группу обучения
            </p>
          </div>
        )}
      </div>

      {/* Group Form Panel */}
      <RightPanel
        isOpen={groupFormOpen}
        onClose={() => {
          setGroupFormOpen(false)
          setEditingGroup(undefined)
        }}
        title={editingGroup ? "Редактировать группу" : "Создать группу"}
        description={editingGroup ? "Измените данные группы" : "Добавьте новую группу обучения"}
      >
        <GroupForm
          group={editingGroup}
          programs={programs}
          teachers={teachers}
          onSubmit={handleSubmitGroupForm}
          onCancel={() => {
            setGroupFormOpen(false)
            setEditingGroup(undefined)
          }}
          isLoading={createGroupMutation.isPending || updateGroupMutation.isPending}
        />
      </RightPanel>

      {/* Students Management Panel */}
      <RightPanel
        isOpen={!!managingGroup}
        onClose={() => {
          setManagingGroup(undefined)
          setAddStudentOpen(false)
          setSelectedEnrollment(undefined)
          setRecommendationOpen(false)
        }}
        title={managingGroup?.name || ""}
        description="Управление студентами"
        width="lg"
      >
        {managingGroup && (
          <div className="space-y-4">
            <Button
              onClick={() => setAddStudentOpen(true)}
              className="w-full gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Добавить студента
            </Button>

            <div className="space-y-3">
              {getGroupStudents(managingGroup.id).length > 0 ? (
                getGroupStudents(managingGroup.id).map((enrollment) => (
                  <Card key={enrollment.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground">
                            {getStudent(enrollment.student_id)?.full_name ||
                              getStudent(enrollment.student_id)?.email}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getStudent(enrollment.student_id)?.email}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedEnrollment(enrollment)
                              setRecommendationOpen(true)
                            }}
                            title="Отправить рекомендацию"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => deleteEnrollmentMutation.mutate(enrollment.id)}
                            title="Удалить студента"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Нет студентов</p>
                </div>
              )}
            </div>
          </div>
        )}
      </RightPanel>

      {/* Add Student Panel */}
      <RightPanel
        isOpen={addStudentOpen && !!managingGroup}
        onClose={() => setAddStudentOpen(false)}
        title="Добавить студента"
        description={managingGroup?.name}
        width="md"
      >
        {managingGroup && (
          <AddStudentForm
            students={users.filter((u) => u.role === "STUDENT")}
            enrolledStudentIds={groupEnrollmentIds}
            onSubmit={handleAddStudent}
            onCancel={() => setAddStudentOpen(false)}
            isLoading={createEnrollmentMutation.isPending}
          />
        )}
      </RightPanel>

      {/* Recommendation Panel */}
      <RightPanel
        isOpen={recommendationOpen && !!selectedEnrollment && !!managingGroup}
        onClose={() => {
          setRecommendationOpen(false)
          setSelectedEnrollment(undefined)
        }}
        title="Отправить рекомендацию"
        description={getStudent(selectedEnrollment?.student_id || "")?.full_name || undefined}
        width="md"
      >
        {selectedEnrollment && managingGroup && (
          <RecommendationForm
            programs={programs}
            onSubmit={(programId) => {
              recommendMutation.mutate({
                student_id: selectedEnrollment.student_id,
                program_id: programId,
              })
            }}
            onCancel={() => {
              setRecommendationOpen(false)
              setSelectedEnrollment(undefined)
            }}
            isLoading={recommendMutation.isPending}
          />
        )}
      </RightPanel>
    </div>
  )
}

// ─── Recommendation Form ──────────────────────────────────────────────────────

function RecommendationForm({
  programs,
  onSubmit,
  onCancel,
  isLoading,
}: {
  programs: Program[]
  onSubmit: (programId: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [selectedProgramId, setSelectedProgramId] = useState("")
  const [comment, setComment] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProgramId) return
    onSubmit(selectedProgramId)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="program" className="text-base font-semibold">
          Выберите программу
        </Label>
        <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={isLoading}>
          <SelectTrigger id="program" className="mt-2">
            <SelectValue placeholder="Программы" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="comment" className="text-base font-semibold">
          Комментарий (опционально)
        </Label>
        <textarea
          id="comment"
          placeholder="Добавьте комментарий для студента"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
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
          disabled={isLoading || !selectedProgramId}
          className="flex-1 gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Отправить
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
