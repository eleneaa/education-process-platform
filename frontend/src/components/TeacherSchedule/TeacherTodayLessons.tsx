import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { Clock, BookOpen, Users, MapPin } from "lucide-react"
import { getLessons, getGroups, getPrograms } from "@/client/custom-api"
import useAuth from "@/hooks/useAuth"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import type { Lesson } from "@/client/custom-api"

const lessonColors = [
  { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700", dot: "bg-blue-400" },
  { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700", dot: "bg-purple-400" },
  { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-700", dot: "bg-cyan-400" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", dot: "bg-amber-400" },
  { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-700", dot: "bg-pink-400" },
  { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-700", dot: "bg-yellow-400" },
]

const getLessonColor = (groupId: string) => {
  const index = groupId.charCodeAt(0) % lessonColors.length
  return lessonColors[index]
}

export function TeacherTodayLessons() {
  const { user } = useAuth()

  const { data: lessonsResponse } = useQuery({
    queryKey: ["lessons"],
    queryFn: () => getLessons(),
  })

  const { data: groupsResponse } = useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroups(),
  })

  const { data: programsResponse } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(),
  })

  const lessons = lessonsResponse?.data || []
  const groups = groupsResponse?.data || []
  const programs = programsResponse?.data || []

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

  // Get teacher's program IDs
  const teacherProgramIds = useMemo(() => {
    if (!user?.id) return new Set<string>()
    const ids = new Set<string>()
    programs.forEach((program: any) => {
      if (program.teachers?.some((t: any) => t.id === user.id)) {
        ids.add(program.id)
      }
    })
    return ids
  }, [programs, user?.id])

  // Get today's lessons for teacher
  const todayLessons = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    return lessons
      .filter((lesson: Lesson) => {
        const lessonDate = new Date(lesson.scheduled_at).toISOString().split("T")[0]
        if (lessonDate !== today) return false
        const group = groupMap.get(lesson.group_id)
        if (!group) return false
        return teacherProgramIds.has(group.program_id)
      })
      .sort((a: Lesson, b: Lesson) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )
  }, [lessons, groupMap, teacherProgramIds])

  if (todayLessons.length === 0) {
    return (
      <div className="px-10 py-8">
        <h2 className="text-lg font-semibold mb-4">Занятия на сегодня</h2>
        <div className="p-6 border border-dashed border-hair rounded-lg text-center">
          <p className="text-mute">Сегодня занятий нет</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-10 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Занятия на сегодня</h2>
        <Link to="/schedule">
          <Button variant="outline" size="sm">Открыть расписание</Button>
        </Link>
      </div>
      <div className="space-y-3">
        {todayLessons.map((lesson: Lesson) => {
          const group = groupMap.get(lesson.group_id)
          const program = group ? programMap.get(group.program_id) : null
          const lessonDate = new Date(lesson.scheduled_at)
          const timeStr = lessonDate.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })
          const color = getLessonColor(lesson.group_id)

          return (
            <div
              key={lesson.id}
              className={`p-4 rounded-lg border-l-4 ${color.bg} ${color.border} flex items-start gap-4`}
            >
              <div className={`${color.dot} w-3 h-3 rounded-full flex-shrink-0 mt-1.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className={`font-semibold ${color.text}`}>{lesson.title}</div>
                    <div className="flex items-center gap-2 text-sm text-mute mt-1">
                      <Clock className="w-4 h-4" />
                      {timeStr}
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-mute" />
                    <span className="text-mute">{program?.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-mute" />
                    <span className="text-mute">{group?.name}</span>
                  </div>
                  {lesson.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-mute" />
                      <span className="text-mute">{lesson.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
