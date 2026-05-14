import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { getLessons, getGroups, getPrograms } from "@/client/custom-api"
import useAuth from "@/hooks/useAuth"

interface KPICardProps {
  label: string
  value: string | number
  footer?: string
}

function KPICard({ label, value, footer }: KPICardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="label-sm">{label}</div>
      <div className="kpi-value">{value}</div>
      {footer && <div className="kpi-footer">{footer}</div>}
    </div>
  )
}

export function TeacherKPISection() {
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

  const teacherGroups = useMemo(() => {
    return groups.filter((group: any) => {
      return teacherProgramIds.has(group.program_id)
    })
  }, [groups, teacherProgramIds])

  const totalStudents = useMemo(() => {
    return teacherGroups.reduce((sum: number, group: any) => sum + (group.student_count || 0), 0)
  }, [teacherGroups])

  const activeGroups = useMemo(() => {
    return teacherGroups.filter((group: any) => group.status === "active").length
  }, [teacherGroups])

  const thisWeekLessons = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return lessons.filter((lesson: any) => {
      const lessonDate = new Date(lesson.scheduled_at)
      const group = groups.find((g: any) => g.id === lesson.group_id)
      if (!group || !teacherProgramIds.has(group.program_id)) return false
      return lessonDate >= weekStart && lessonDate <= weekEnd
    }).length
  }, [lessons, groups, teacherProgramIds])

  const hoursThisMonth = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    const totalMinutes = lessons
      .filter((lesson: any) => {
        const lessonDate = new Date(lesson.scheduled_at)
        const group = groups.find((g: any) => g.id === lesson.group_id)
        if (!group || !teacherProgramIds.has(group.program_id)) return false
        return lessonDate >= monthStart && lessonDate <= monthEnd
      })
      .reduce((sum: number, lesson: any) => sum + (lesson.duration_minutes || 0), 0)

    return (totalMinutes / 60).toFixed(1)
  }, [lessons, groups, teacherProgramIds])

  if (lessonsLoading || groupsLoading || programsLoading) {
    return (
      <div className="px-10">
        <div className="kpi-grid">
          <div className="h-24 bg-mute/10 rounded animate-pulse" />
          <div className="h-24 bg-mute/10 rounded animate-pulse" />
          <div className="h-24 bg-mute/10 rounded animate-pulse" />
          <div className="h-24 bg-mute/10 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-10">
      <div className="kpi-grid">
        <KPICard
          label="СТУДЕНТОВ"
          value={totalStudents}
          footer="в ваших группах"
        />
        <KPICard
          label="АКТИВНЫХ ГРУПП"
          value={activeGroups}
          footer="статус active"
        />
        <KPICard
          label="ЗАНЯТИЙ НА НЕДЕЛЕ"
          value={thisWeekLessons}
          footer="с пн по вс"
        />
        <KPICard
          label="ЧАСОВ В МЕСЯЦЕ"
          value={hoursThisMonth}
          footer="всего преподавания"
        />
      </div>
    </div>
  )
}
