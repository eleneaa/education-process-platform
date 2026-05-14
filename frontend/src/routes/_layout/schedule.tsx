import { createFileRoute } from "@tanstack/react-router"
import { TeacherSchedule } from "@/components/TeacherSchedule/TeacherSchedule"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/schedule")({
  component: SchedulePage,
  head: () => ({
    meta: [{ title: "Расписание" }],
  }),
})

function SchedulePage() {
  const { user } = useAuth()
  const isTeacher = user?.role?.toLowerCase() === "teacher"

  if (!isTeacher) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Эта страница доступна только для преподавателей</p>
      </div>
    )
  }

  return <TeacherSchedule />
}
