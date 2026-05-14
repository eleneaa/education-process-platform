import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, Users, Pencil, Trash2, X, Check, Plus } from "lucide-react"
import { useState, useMemo } from "react"

import { getGroups, getLessons, getEnrollments, getAttendance, updateAttendance, createAttendance, getPrograms, getUsers, getModules, getProgresses, updateGroup, deleteGroup, createEnrollment, deleteEnrollment } from "@/client/custom-api"
import type { Attendance, AttendanceStatus, Lesson, Group } from "@/client/custom-types"
import type { UserPublic } from "@/client/types.gen"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/groups/$groupId")({
  component: GroupDetailPage,
  head: () => ({
    meta: [{ title: "Группа" }],
  }),
})

function GroupDetailPage() {
  const { groupId } = useParams({ from: "/_layout/groups/$groupId" })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [activeTab, setActiveTab] = useState("students")
  const [editMode, setEditMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addStudentOpen, setAddStudentOpen] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editProgramId, setEditProgramId] = useState("")
  const [editTeacherId, setEditTeacherId] = useState("")
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")

  const { data: groupsData } = useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroups(),
  })

  const { data: enrollmentsData } = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => getEnrollments(),
  })

  const { data: lessonsData } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => getLessons(),
  })

  const { data: attendanceData } = useQuery({
    queryKey: ["attendance", groupId],
    queryFn: () => getAttendance(groupId),
  })

  const { data: programsData } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(),
  })

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  })

  const { data: modulesData } = useQuery({
    queryKey: ["modules"],
    queryFn: () => getModules(),
  })

  const { data: progressesData } = useQuery({
    queryKey: ["progresses"],
    queryFn: () => getProgresses(),
  })

  const createAttendanceMutation = useMutation({
    mutationFn: (vars: { lessonId: string; studentId: string; status: AttendanceStatus }) =>
      createAttendance({
        lesson_id: vars.lessonId,
        student_id: vars.studentId,
        status: vars.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", groupId] })
      showSuccessToast("Посещаемость отмечена")
    },
    onError: () => showErrorToast("Ошибка при отметке посещаемости"),
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: (vars: { attendanceId: string; status: AttendanceStatus }) =>
      updateAttendance(vars.attendanceId, { status: vars.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", groupId] })
      showSuccessToast("Посещаемость обновлена")
    },
    onError: () => showErrorToast("Ошибка при обновлении"),
  })

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      showSuccessToast("Группа обновлена")
      setEditMode(false)
    },
    onError: () => showErrorToast("Ошибка при обновлении группы"),
  })

  const deleteGroupMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      showSuccessToast("Группа удалена")
      navigate({ to: "/groups" })
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

  const group = useMemo(
    () => groupsData?.data.find((g) => g.id === groupId),
    [groupsData, groupId],
  )

  const program = useMemo(
    () => group && programsData?.data.find((p) => p.id === group.program_id),
    [group, programsData],
  )

  const teacher = useMemo(
    () => group?.teacher_id && usersData?.data.find((u) => u.id === group.teacher_id),
    [group, usersData],
  )

  const students = useMemo(() => {
    if (!enrollmentsData) return []
    return enrollmentsData.data
      .filter((e) => e.group_id === groupId)
      .map((e) => usersData?.data.find((u) => u.id === e.student_id))
      .filter(Boolean)
  }, [enrollmentsData, groupId, usersData])

  const groupLessons = useMemo(
    () => lessonsData?.data.filter((l) => l.group_id === groupId) || [],
    [lessonsData, groupId],
  )

  const attendance = useMemo(() => attendanceData?.data || [], [attendanceData])

  const modules = useMemo(
    () => modulesData?.data.filter((m) => m.program_id === group?.program_id) || [],
    [modulesData, group],
  )

  const progresses = useMemo(
    () => progressesData?.data.filter((p) => modules.some((m) => m.id === p.module_id)) || [],
    [progressesData, modules],
  )

  if (!group) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-semibold mb-2">Группа не найдена</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Возможно, группа была удалена или URL неправильный.
            </p>
            <Link to="/groups">
              <Button className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Вернуться к группам
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleEditClick = () => {
    setEditName(group.name)
    setEditProgramId(group.program_id)
    setEditTeacherId(group.teacher_id || "")
    setEditStartDate(group.start_date ? group.start_date.split("T")[0] : "")
    setEditEndDate(group.end_date ? group.end_date.split("T")[0] : "")
    setEditMode(true)
  }

  const handleSaveEdit = () => {
    if (!editName.trim() || !editProgramId) return
    updateGroupMutation.mutate({
      id: group.id,
      data: {
        name: editName.trim(),
        program_id: editProgramId,
        teacher_id: editTeacherId || undefined,
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
      },
    })
  }

  const availableStudents = usersData?.data.filter(
    (u) => u.role === "STUDENT" && !students.some((s) => s?.id === u.id)
  ) ?? []

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link to="/groups" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Назад к группам
        </Link>

        {/* Header Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {editMode ? (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Название группы</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">Программа обучения</Label>
                  <Select value={editProgramId} onValueChange={setEditProgramId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Выберите программу" />
                    </SelectTrigger>
                    <SelectContent>
                      {programsData?.data.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold">Преподаватель</Label>
                  <Select value={editTeacherId} onValueChange={setEditTeacherId}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Выберите преподавателя (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.data.filter((u) => u.role === "TEACHER").map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.full_name || t.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-semibold">Начало</Label>
                    <Input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Конец</Label>
                    <Input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updateGroupMutation.isPending}
                    className="flex-1 gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Сохранить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    disabled={updateGroupMutation.isPending}
                    className="flex-1 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl lg:text-4xl font-bold mb-3">{group.name}</h1>
                    {program && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{program.title}</span>
                      </div>
                    )}
                    {teacher && (
                      <div className="text-muted-foreground text-sm">
                        Преподаватель: <span className="text-foreground font-medium">{teacher.full_name || teacher.email}</span>
                      </div>
                    )}
                    {editStartDate && (
                      <div className="text-muted-foreground text-sm mt-2">
                        Период: {new Date(editStartDate).toLocaleDateString("ru-RU")} - {editEndDate ? new Date(editEndDate).toLocaleDateString("ru-RU") : "не указано"}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditClick}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-muted-foreground text-sm mb-1">Студентов</div>
                    <div className="text-2xl font-bold">{students.length}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-muted-foreground text-sm mb-1">Занятий</div>
                    <div className="text-2xl font-bold">{groupLessons.length}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-muted-foreground text-sm mb-1">Модулей</div>
                    <div className="text-2xl font-bold">{modules.length}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardContent className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="students">Студенты</TabsTrigger>
                <TabsTrigger value="attendance">Посещаемость</TabsTrigger>
                <TabsTrigger value="progress">Прогресс</TabsTrigger>
              </TabsList>

              {/* Tab: Students */}
              <TabsContent value="students">
                <div className="space-y-4">
                  <Button
                    onClick={() => setAddStudentOpen(!addStudentOpen)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить студента
                  </Button>

                  {addStudentOpen && (
                    <Card className="p-4">
                      <div className="space-y-3">
                        {availableStudents.length > 0 ? (
                          availableStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium">{student.full_name}</div>
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  createEnrollmentMutation.mutate({
                                    student_id: student.id,
                                    group_id: group.id,
                                  })
                                }}
                                disabled={createEnrollmentMutation.isPending}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">Нет доступных студентов</p>
                        )}
                      </div>
                    </Card>
                  )}

                  {students.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">Нет студентов в группе</div>
                  ) : (
                    <div className="space-y-3">
                      {students.map((student) => {
                        const enrollment = enrollmentsData?.data.find((e) => e.student_id === student?.id && e.group_id === groupId)
                        return (
                          <div key={student?.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {student?.full_name?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{student?.full_name}</div>
                              <div className="text-sm text-muted-foreground">{student?.email}</div>
                            </div>
                            {enrollment && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteEnrollmentMutation.mutate(enrollment.id)}
                                disabled={deleteEnrollmentMutation.isPending}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab: Attendance */}
              <TabsContent value="attendance">
                {groupLessons.length === 0 || students.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Нет данных для отображения</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Студент</th>
                          {groupLessons.slice(0, 5).map((lesson) => {
                            const date = new Date(lesson.scheduled_at)
                            const dateStr = date.toLocaleDateString("ru-RU", { month: "2-digit", day: "2-digit" })
                            return (
                              <th key={lesson.id} className="text-center py-3 px-2 font-semibold text-muted-foreground text-xs">
                                {dateStr}
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student?.id} className="border-b border-border/50">
                            <td className="py-3 px-4 font-medium">{student?.full_name}</td>
                            {groupLessons.slice(0, 5).map((lesson) => {
                              const att = attendance.find(
                                (a) => a.lesson_id === lesson.id && a.student_id === student?.id,
                              )
                              const status = att?.status ?? ("present" as AttendanceStatus)
                              const icon = status === "present" ? "✅" : status === "absent" ? "❌" : "⏰"
                              return (
                                <td key={lesson.id} className="text-center py-3 px-2">
                                  <button
                                    onClick={() => {
                                      const nextStatus: AttendanceStatus =
                                        status === "present" ? "absent" : status === "absent" ? "late" : "present"
                                      if (att) {
                                        updateAttendanceMutation.mutate({
                                          attendanceId: att.id,
                                          status: nextStatus,
                                        })
                                      } else {
                                        createAttendanceMutation.mutate({
                                          lessonId: lesson.id,
                                          studentId: student?.id || "",
                                          status: nextStatus,
                                        })
                                      }
                                    }}
                                    className="text-xl hover:scale-125 transition cursor-pointer"
                                    title={`Статус: ${status}`}
                                  >
                                    {icon}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* Tab: Progress */}
              <TabsContent value="progress">
                {modules.length === 0 || students.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">Нет данных для отображения</div>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div key={student?.id} className="p-4 border border-border rounded-lg">
                        <div className="font-medium mb-4">{student?.full_name}</div>
                        <div className="grid grid-cols-2 gap-3">
                          {modules.map((module) => {
                            const progress = progresses.find(
                              (p) => p.student_id === student?.id && p.module_id === module.id,
                            )
                            const statusIcon =
                              progress?.status === "COMPLETED" ? "✅" : progress?.status === "IN_PROGRESS" ? "🔄" : "⬜"
                            return (
                              <div key={module.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                                <span>{statusIcon}</span>
                                <span className="flex-1">{module.title}</span>
                                {progress?.score && <span className="text-muted-foreground">{progress.score}%</span>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={() => deleteGroupMutation.mutate(groupId)}
          title="Удалить группу?"
          description={`Вы уверены, что хотите удалить группу "${group.name}"? Это действие необратимо.`}
        />
      </div>
    </div>
  )
}
