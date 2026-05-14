import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getLessons, getGroups, getPrograms } from "@/client/custom-api"
import useAuth from "@/hooks/useAuth"

const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]

export function TeacherLessonStats() {
  const { user } = useAuth()

  const { data: lessonsResponse, isLoading: lessonsLoading } = useQuery({
    queryKey: ["lessons"],
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

  const lessons = lessonsResponse?.data || []
  const groups = groupsResponse?.data || []
  const programs = programsResponse?.data || []

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

  const chartData = useMemo(() => {
    const now = new Date()
    const data = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      const dayLabel = dayNames[date.getDay()]
      const dateStr = date.toISOString().split("T")[0]

      const lessonCount = lessons.filter((lesson: any) => {
        const lessonDate = new Date(lesson.scheduled_at)
        const group = groups.find((g: any) => g.id === lesson.group_id)
        if (!group || !teacherProgramIds.has(group.program_id)) return false
        return lessonDate >= date && lessonDate < nextDate
      }).length

      data.push({
        day: dayLabel,
        date: dateStr,
        count: lessonCount,
      })
    }

    return data
  }, [lessons, groups, teacherProgramIds])

  const totalLessons = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.count, 0)
  }, [chartData])

  if (lessonsLoading || groupsLoading || programsLoading) {
    return (
      <div className="px-10 py-12">
        <div className="card-sharp p-6">
          <h3 className="heading-sm mb-6">Занятия за последние 7 дней</h3>
          <div className="h-64 bg-mute/10 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-10 py-12">
      <div className="card-sharp p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-sm">Занятия за последние 7 дней</h3>
          <div className="text-sm text-mute">Всего: {totalLessons} занятий</div>
        </div>
        {chartData.some((item) => item.count > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hair)" />
              <XAxis dataKey="day" stroke="var(--mute)" style={{ fontSize: "12px" }} />
              <YAxis stroke="var(--mute)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--hair)" }}
                labelStyle={{ color: "var(--fg)" }}
                formatter={(value) => [`${value} занятий`, "Занятия"]}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-16 text-mute">Нет занятий в последние 7 дней</div>
        )}
      </div>
    </div>
  )
}
