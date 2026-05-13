import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Clock, MapPin, X, BookOpen, User } from "lucide-react"
import { useState, useMemo } from "react"
import { getLessons, getGroups, getPrograms, getUsers } from "@/client/custom-api"
import { Button } from "@/components/ui/button"
import type { Lesson } from "@/client/custom-api"

const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
]

const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

// Color palette for different lessons (optimized for both light and dark modes)
const lessonColors = [
  { bg: "bg-blue-500/30 dark:bg-blue-400/25", border: "border-blue-400 dark:border-blue-300", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500 dark:bg-blue-400" },
  { bg: "bg-purple-500/30 dark:bg-purple-400/25", border: "border-purple-400 dark:border-purple-300", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500 dark:bg-purple-400" },
  { bg: "bg-cyan-500/30 dark:bg-cyan-400/25", border: "border-cyan-400 dark:border-cyan-300", text: "text-cyan-700 dark:text-cyan-300", dot: "bg-cyan-500 dark:bg-cyan-400" },
  { bg: "bg-emerald-500/30 dark:bg-emerald-400/25", border: "border-emerald-400 dark:border-emerald-300", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500 dark:bg-emerald-400" },
  { bg: "bg-amber-500/30 dark:bg-amber-400/25", border: "border-amber-400 dark:border-amber-300", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500 dark:bg-amber-400" },
  { bg: "bg-pink-500/30 dark:bg-pink-400/25", border: "border-pink-400 dark:border-pink-300", text: "text-pink-700 dark:text-pink-300", dot: "bg-pink-500 dark:bg-pink-400" },
]

const getLessonColor = (groupId: string) => {
  const index = groupId.charCodeAt(0) % lessonColors.length
  return lessonColors[index]
}

export function StudentSchedule() {
  const { data: lessonsResponse, isLoading: lessonsLoading } = useQuery({
    queryKey: ["student-lessons"],
    queryFn: () => getLessons(),
  })

  const { data: groupsResponse, isLoading: groupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroups(),
  })

  const { data: programsResponse, isLoading: programsLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(),
  })

  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  })

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const lessons = lessonsResponse?.data || []
  const groups = groupsResponse?.data || []
  const programs = programsResponse?.data || []
  const users = usersResponse?.data || []

  // Create lookup maps
  const groupMap = useMemo(() => {
    const map = new Map<string, any>()
    groups.forEach((group: any) => {
      map.set(group.id, group)
    })
    return map
  }, [groups])

  const programMap = useMemo(() => {
    const map = new Map<string, any>()
    programs.forEach((program: any) => {
      map.set(program.id, program)
    })
    return map
  }, [programs])

  const userMap = useMemo(() => {
    const map = new Map<string, any>()
    users.forEach((user: any) => {
      map.set(user.id, user)
    })
    return map
  }, [users])

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson[]>()
    lessons.forEach((lesson) => {
      const date = new Date(lesson.scheduled_at)
      const dateStr = date.toISOString().split("T")[0]
      if (!map.has(dateStr)) {
        map.set(dateStr, [])
      }
      map.get(dateStr)?.push(lesson)
    })
    return map
  }, [lessons])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1)
    return first.getDay() === 0 ? 6 : first.getDay() - 1
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: firstDay }, () => 0)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const selectedDateLessons = selectedDate
    ? (lessonsByDate.get(selectedDate) || []).sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      )
    : []

  const selectedDateDisplay = selectedDate
    ? new Date(selectedDate).toLocaleDateString("ru-RU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="display-hero mb-2">Расписание занятий</h1>
          <p className="body-md text-mute">
            Ваши предстоящие занятия в группах программ обучения
          </p>
        </div>

        {/* Calendar */}
        <div className="card-sharp p-8 border border-hair">
          <div className="flex items-center justify-between mb-8">
            <h2 className="heading-md text-2xl">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Сегодня
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {lessonsLoading || groupsLoading || programsLoading || usersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-mute/10 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Day names */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-sm font-bold text-mute text-center py-3 uppercase tracking-wider"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dateStr = day
                    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                        .toISOString()
                        .split("T")[0]
                    : ""
                  const dayLessons = dateStr ? lessonsByDate.get(dateStr) || [] : []
                  const isToday =
                    day > 0 &&
                    new Date().toISOString().split("T")[0] === dateStr
                  const isCurrentMonth = day > 0
                  const isSelected = selectedDate === dateStr && day > 0
                  const hasLessons = dayLessons.length > 0

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (dateStr && hasLessons) {
                          setSelectedDate(dateStr)
                        }
                      }}
                      disabled={!hasLessons || !isCurrentMonth}
                      className={`aspect-square p-3 border rounded-lg transition flex flex-col relative overflow-hidden ${
                        !isCurrentMonth
                          ? "bg-mute/5 border-transparent"
                          : isSelected
                            ? "bg-accent/15 border-accent ring-2 ring-accent/50"
                            : isToday
                              ? "bg-accent/8 border-accent/60"
                              : hasLessons
                                ? "bg-surface-1 border-hair hover:border-accent/60 cursor-pointer"
                                : "bg-surface-1 border-hair"
                      } ${!hasLessons && isCurrentMonth ? "cursor-default" : ""}`}
                    >
                      {/* Gradient background for days with lessons */}
                      {hasLessons && (
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
                      )}

                      {day > 0 && (
                        <>
                          <div
                            className={`text-lg font-bold mb-2 relative z-10 ${
                              isToday
                                ? "text-accent"
                                : isSelected
                                  ? "text-accent"
                                  : "text-fg"
                            }`}
                          >
                            {day}
                          </div>
                          {dayLessons.length > 0 && (
                            <>
                              <div className="space-y-1 flex-1 relative z-10 overflow-hidden max-h-14">
                                {dayLessons.slice(0, 2).map((lesson) => {
                                  const lessonDate = new Date(lesson.scheduled_at)
                                  const timeStr = lessonDate.toLocaleTimeString("ru-RU", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                  const color = getLessonColor(lesson.group_id)
                                  return (
                                    <div
                                      key={lesson.id}
                                      className={`text-xs rounded px-1.5 py-1 line-clamp-1 leading-tight border ${color.bg} ${color.border} ${color.text} font-medium flex items-center gap-1 flex-shrink-0`}
                                    >
                                      <span className={`${color.dot} w-1 h-1 rounded-full flex-shrink-0`} />
                                      <span className="font-semibold flex-shrink-0">{timeStr}</span>
                                      <span className="truncate">{lesson.title}</span>
                                    </div>
                                  )
                                })}
                              </div>
                              {dayLessons.length > 2 && (
                                <div className="text-xs text-mute font-medium px-1.5 py-0.5">
                                  +{dayLessons.length - 2}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lesson Details Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="card-sharp p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-hair"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="text-sm font-semibold text-accent mb-1 uppercase tracking-wider">
                  Занятия
                </div>
                <h2 className="heading-md text-2xl">{selectedDateDisplay}</h2>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-mute hover:text-fg transition p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedDateLessons.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-mute">Нет занятий на эту дату</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateLessons.map((lesson, index) => {
                  const lessonDate = new Date(lesson.scheduled_at)
                  const timeStr = lessonDate.toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  const color = getLessonColor(lesson.group_id)
                  const group = groupMap.get(lesson.group_id)
                  const program = group ? programMap.get(group.program_id) : null
                  const teacher = group?.teacher_id ? userMap.get(group.teacher_id) : null
                  const teacherName = teacher?.full_name || "Преподаватель не назначен"
                  const lessonNumber = index + 1

                  return (
                    <div
                      key={lesson.id}
                      className={`p-5 border rounded-lg bg-surface-1 hover:border-accent/50 transition ${color.border}`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`${color.dot} w-3 h-3 rounded-full mt-1.5 flex-shrink-0`} />
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${color.text}`}>
                            {lesson.title}
                          </h3>
                          {program && (
                            <div className="flex items-center gap-1.5 text-sm text-mute mt-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{program.title}</span>
                            </div>
                          )}
                          {teacher && (
                            <div className="flex items-center gap-1.5 text-sm text-mute mt-1">
                              <User className="w-3.5 h-3.5" />
                              <span>{teacher.full_name}</span>
                            </div>
                          )}
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded ${color.bg} ${color.text}`}>
                          {lessonNumber}
                        </div>
                      </div>

                      {lesson.description && (
                        <p className="text-sm text-mute mb-4 leading-relaxed ml-6">
                          {lesson.description}
                        </p>
                      )}

                      <div className="space-y-2 ml-6">
                        <div className="flex items-center gap-3 text-sm">
                          <Clock className={`w-4 h-4 ${color.text} flex-shrink-0`} />
                          <span className="text-fg">{timeStr}</span>
                          {lesson.duration_minutes && (
                            <span className="text-mute">
                              ({lesson.duration_minutes} мин)
                            </span>
                          )}
                        </div>
                        {lesson.location && (
                          <div className="flex items-center gap-3 text-sm">
                            <MapPin className={`w-4 h-4 ${color.text} flex-shrink-0`} />
                            <span className="text-fg">{lesson.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
