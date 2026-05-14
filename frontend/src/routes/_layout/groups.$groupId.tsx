import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useParams, Link, useNavigate, useSearch } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, Users, Pencil, Trash2, X, Check, Plus, MessageSquare } from "lucide-react"
import { useState, useMemo, useEffect } from "react"

import { getGroups, getLessons, getEnrollments, getAttendance, updateAttendance, createAttendance, getPrograms, getUsers, getModules, getProgresses, updateGroup, deleteGroup, createEnrollment, deleteEnrollment, createLesson, deleteLesson, updateLesson, getStudentRecommendations, createRecommendation, deleteRecommendation } from "@/client/custom-api"
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
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab as string | undefined,
  }),
})

function GroupDetailPage() {
  const { groupId } = useParams({ from: "/_layout/groups/$groupId" })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const search = useSearch({ from: "/_layout/groups/$groupId" }) as { tab?: string }
  const [activeTab, setActiveTab] = useState<string>(search?.tab || "students")

  useEffect(() => {
    if (search?.tab) {
      setActiveTab(search.tab)
    }
  }, [search?.tab])
  const [editMode, setEditMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [createSeriesOpen, setCreateSeriesOpen] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [recommendationStudentId, setRecommendationStudentId] = useState<string | null>(null)
  const [recommendationText, setRecommendationText] = useState("")

  // Edit form state
  const [editName, setEditName] = useState("")
  const [editProgramId, setEditProgramId] = useState("")
  const [editTeacherId, setEditTeacherId] = useState("")
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")

  // Lesson series form state
  const [seriesTitle, setSeriesTitle] = useState("")
  const [seriesModuleId, setSeriesModuleId] = useState("")
  const [seriesStartDate, setSeriesStartDate] = useState("")
  const [seriesStartTime, setSeriesStartTime] = useState("10:00")
  const [seriesCount, setSeriesCount] = useState("4")
  const [seriesInterval, setSeriesInterval] = useState("1") // days
  const [seriesDuration, setSeriesDuration] = useState("90")

  // Edit lesson form state
  const [editLessonTitle, setEditLessonTitle] = useState("")
  const [editLessonModuleId, setEditLessonModuleId] = useState("")
  const [editLessonDate, setEditLessonDate] = useState("")
  const [editLessonTime, setEditLessonTime] = useState("")
  const [editLessonDuration, setEditLessonDuration] = useState("")

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

  const createLessonMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      queryClient.invalidateQueries({ queryKey: ["attendance", groupId] })
      showSuccessToast("Урок создан")
    },
    onError: () => showErrorToast("Ошибка при создании урока"),
  })

  const deleteLessonMutation = useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      queryClient.invalidateQueries({ queryKey: ["attendance", groupId] })
      showSuccessToast("Урок удален")
    },
    onError: () => showErrorToast("Ошибка при удалении урока"),
  })

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLesson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
      queryClient.invalidateQueries({ queryKey: ["attendance", groupId] })
      showSuccessToast("Урок обновлен")
      setEditingLessonId(null)
    },
    onError: () => showErrorToast("Ошибка при обновлении урока"),
  })

  const createRecommendationMutation = useMutation({
    mutationFn: (data: any) => createRecommendation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] })
      showSuccessToast("Рекомендация отправлена")
      setRecommendationStudentId(null)
      setRecommendationText("")
    },
    onError: () => showErrorToast("Ошибка при отправке рекомендации"),
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
                <TabsTrigger value="lessons">Уроки</TabsTrigger>
                <TabsTrigger value="attendance">Посещаемость</TabsTrigger>
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
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRecommendationStudentId(student?.id || null)}
                                className="gap-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Рекомендация
                              </Button>
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
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {recommendationStudentId && (
                    <Card className="mt-8 p-6 border-2 border-accent">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          Рекомендация для {students.find((s) => s?.id === recommendationStudentId)?.full_name}
                        </h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRecommendationStudentId(null)
                            setRecommendationText("")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Рекомендация</Label>
                          <textarea
                            value={recommendationText}
                            onChange={(e) => setRecommendationText(e.target.value)}
                            placeholder="Введите рекомендацию для студента..."
                            className="w-full min-h-32 mt-2 p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-border">
                          <Button
                            onClick={() => {
                              if (!recommendationText.trim()) {
                                showErrorToast("Введите рекомендацию")
                                return
                              }
                              createRecommendationMutation.mutate({
                                student_id: recommendationStudentId,
                                module_id: null,
                                content: recommendationText.trim(),
                                recommendation_type: "general",
                              })
                            }}
                            disabled={createRecommendationMutation.isPending}
                            className="flex-1 gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Отправить
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRecommendationStudentId(null)
                              setRecommendationText("")
                            }}
                            disabled={createRecommendationMutation.isPending}
                            className="flex-1"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Tab: Lessons */}
              <TabsContent value="lessons">
                <div className="space-y-6">
                  <div>
                    <Button onClick={() => setCreateSeriesOpen(!createSeriesOpen)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Создать серию уроков
                    </Button>

                    {createSeriesOpen && (
                      <Card className="mt-4 p-6">
                        <h3 className="text-lg font-semibold mb-4">Создание серии уроков</h3>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Название урока</Label>
                            <Input
                              value={seriesTitle}
                              onChange={(e) => setSeriesTitle(e.target.value)}
                              placeholder="е.г., Python - Переменные"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Модуль</Label>
                            <Select value={seriesModuleId} onValueChange={setSeriesModuleId}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Выберите модуль" />
                              </SelectTrigger>
                              <SelectContent>
                                {modules.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Начальная дата</Label>
                              <Input
                                type="date"
                                value={seriesStartDate}
                                onChange={(e) => setSeriesStartDate(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Время</Label>
                              <Input
                                type="time"
                                value={seriesStartTime}
                                onChange={(e) => setSeriesStartTime(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Количество уроков</Label>
                              <Input
                                type="number"
                                value={seriesCount}
                                onChange={(e) => setSeriesCount(e.target.value)}
                                min="1"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Интервал (дни)</Label>
                              <Select value={seriesInterval} onValueChange={setSeriesInterval}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Каждый день</SelectItem>
                                  <SelectItem value="2">Через день</SelectItem>
                                  <SelectItem value="3">Раз в 3 дня</SelectItem>
                                  <SelectItem value="7">Раз в неделю</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Длительность (мин)</Label>
                              <Input
                                type="number"
                                value={seriesDuration}
                                onChange={(e) => setSeriesDuration(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4 border-t border-border">
                            <Button
                              onClick={() => {
                                if (!seriesTitle.trim() || !seriesModuleId || !seriesStartDate) {
                                  showErrorToast("Заполните обязательные поля")
                                  return
                                }
                                const count = parseInt(seriesCount) || 1
                                const interval = parseInt(seriesInterval) || 1
                                const [year, month, day] = seriesStartDate.split("-").map(Number)
                                const [hours, minutes] = seriesStartTime.split(":").map(Number)

                                let created = 0
                                for (let i = 0; i < count; i++) {
                                  const lessonDate = new Date(year, month - 1, day + i * interval, hours, minutes)
                                  createLessonMutation.mutate({
                                    title: seriesTitle.trim(),
                                    group_id: groupId,
                                    module_id: seriesModuleId,
                                    scheduled_at: lessonDate.toISOString(),
                                    duration_minutes: parseInt(seriesDuration),
                                  })
                                  created++
                                }
                                showSuccessToast(`Создано ${created} уроков`)
                                setCreateSeriesOpen(false)
                                setSeriesTitle("")
                                setSeriesModuleId("")
                                setSeriesStartDate("")
                              }}
                              disabled={createLessonMutation.isPending}
                              className="flex-1 gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Создать серию
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setCreateSeriesOpen(false)}
                              disabled={createLessonMutation.isPending}
                              className="flex-1 gap-2"
                            >
                              <X className="h-4 w-4" />
                              Отмена
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {groupLessons.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">Нет уроков</div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Все уроки ({groupLessons.length})</h3>
                      {groupLessons.map((lesson) => {
                        const lessonDate = new Date(lesson.scheduled_at)
                        const dateStr = lessonDate.toLocaleDateString("ru-RU", {
                          weekday: "short",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        const lessonModule = modules.find((m) => m.id === lesson.module_id)
                        const isEditing = editingLessonId === lesson.id

                        return (
                          <div key={lesson.id} className="border border-border rounded-lg">
                            {isEditing ? (
                              <div className="p-4 space-y-4 bg-muted/50">
                                <div>
                                  <Label className="text-sm font-medium">Название</Label>
                                  <Input
                                    value={editLessonTitle}
                                    onChange={(e) => setEditLessonTitle(e.target.value)}
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Модуль</Label>
                                  <Select value={editLessonModuleId} onValueChange={setEditLessonModuleId}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {modules.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                          {m.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Дата</Label>
                                    <Input
                                      type="date"
                                      value={editLessonDate}
                                      onChange={(e) => setEditLessonDate(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Время</Label>
                                    <Input
                                      type="time"
                                      value={editLessonTime}
                                      onChange={(e) => setEditLessonTime(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Длительность (мин)</Label>
                                    <Input
                                      type="number"
                                      value={editLessonDuration}
                                      onChange={(e) => setEditLessonDuration(e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-3 pt-2 border-t border-border">
                                  <Button
                                    onClick={() => {
                                      if (!editLessonTitle.trim()) {
                                        showErrorToast("Заполните название")
                                        return
                                      }
                                      const [year, month, day] = editLessonDate.split("-").map(Number)
                                      const [hours, minutes] = editLessonTime.split(":").map(Number)
                                      const scheduledAt = new Date(year, month - 1, day, hours, minutes).toISOString()

                                      updateLessonMutation.mutate({
                                        id: lesson.id,
                                        data: {
                                          title: editLessonTitle.trim(),
                                          module_id: editLessonModuleId,
                                          scheduled_at: scheduledAt,
                                          duration_minutes: parseInt(editLessonDuration),
                                        },
                                      })
                                    }}
                                    disabled={updateLessonMutation.isPending}
                                    size="sm"
                                    className="flex-1 gap-2"
                                  >
                                    <Check className="h-4 w-4" />
                                    Сохранить
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingLessonId(null)}
                                    disabled={updateLessonMutation.isPending}
                                    size="sm"
                                    className="flex-1 gap-2"
                                  >
                                    <X className="h-4 w-4" />
                                    Отмена
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 p-4">
                                <div className="flex-1">
                                  <div className="font-medium">{lesson.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {dateStr} • {lesson.duration_minutes} мин
                                  </div>
                                  {lessonModule && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <BookOpen className="h-3 w-3" />
                                      {lessonModule.title}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setActiveTab("attendance")}
                                  title="Перейти к посещаемости"
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingLessonId(lesson.id)
                                    setEditLessonTitle(lesson.title)
                                    setEditLessonModuleId(lesson.module_id || "")
                                    const date = new Date(lesson.scheduled_at)
                                    setEditLessonDate(date.toISOString().split("T")[0])
                                    setEditLessonTime(
                                      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
                                    )
                                    setEditLessonDuration(String(lesson.duration_minutes))
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteLessonMutation.mutate(lesson.id)}
                                  disabled={deleteLessonMutation.isPending}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                          {groupLessons.map((lesson) => {
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
                            {groupLessons.map((lesson) => {
                              const att = attendance.find(
                                (a) => a.lesson_id === lesson.id && a.student_id === student?.id,
                              )
                              const status = att?.status ?? ("absent" as AttendanceStatus)
                              let bgColor = "bg-red-200"
                              let hoverColor = "hover:bg-red-300"
                              let title = "Отсутствовал"

                              if (status === "present") {
                                bgColor = "bg-green-200"
                                hoverColor = "hover:bg-green-300"
                                title = "Присутствовал"
                              } else if (status === "late") {
                                bgColor = "bg-yellow-200"
                                hoverColor = "hover:bg-yellow-300"
                                title = "Опоздал"
                              }

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
                                    className={`w-6 h-6 rounded ${bgColor} ${hoverColor} transition cursor-pointer`}
                                    title={title}
                                  ></button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Legend */}
                    <div className="flex gap-6 mt-6 p-4 bg-muted rounded text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-200"></div>
                        <span>Присутствовал</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-200"></div>
                        <span>Опоздал</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-200"></div>
                        <span>Отсутствовал</span>
                      </div>
                    </div>
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
