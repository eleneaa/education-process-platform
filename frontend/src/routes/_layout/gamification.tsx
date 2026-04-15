import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Award, Star, Trophy } from "lucide-react"

import { getAllAchievements, getUserAchievements, getUserPoints } from "@/client/custom-api"
import type { Achievement } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/gamification")({
  component: GamificationPage,
  head: () => ({
    meta: [{ title: "Геймификация" }],
  }),
})

function AchievementCard({
  achievement,
  earned = false,
}: {
  achievement: Achievement
  earned?: boolean
}) {
  return (
    <Card
      className={`flex flex-col transition-shadow hover:shadow-md ${
        earned ? "border-orange-300 bg-orange-50" : "opacity-70"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${
                earned ? "bg-orange-100" : "bg-gray-100"
              }`}
            >
              <Trophy
                className={`h-5 w-5 ${earned ? "text-orange-500" : "text-gray-400"}`}
              />
            </div>
            <CardTitle className="text-sm">{achievement.title}</CardTitle>
          </div>
          {earned && (
            <Badge variant="default" className="shrink-0 bg-orange-500">
              Получено
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-1">
        {achievement.description && (
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
        )}
        {achievement.points_required != null && (
          <div className="mt-auto flex items-center gap-1 pt-2 text-sm">
            <Star className="h-3.5 w-3.5 text-yellow-500" />
            <span className="text-muted-foreground">
              {achievement.points_required} очков
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AdminGamification() {
  const { data: achievements, isError } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAllAchievements,
    placeholderData: { data: [], count: 0 },
  })

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки достижений</p>
  }

  const list = achievements?.data ?? []

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Всего достижений: {achievements?.count ?? 0}
      </p>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Достижений пока нет</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <AchievementCard key={a.id} achievement={a} earned={false} />
          ))}
        </div>
      )}
    </div>
  )
}

function StudentGamification({ userId }: { userId: string }) {
  const { data: allAchievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAllAchievements,
    placeholderData: { data: [], count: 0 },
  })
  const { data: userAchievements } = useQuery({
    queryKey: ["user-achievements", userId],
    queryFn: () => getUserAchievements(userId),
    placeholderData: { data: [], count: 0 },
  })
  const { data: points } = useQuery({
    queryKey: ["user-points", userId],
    queryFn: () => getUserPoints(userId),
    placeholderData: { user_id: userId, points: 0 },
  })

  const earnedIds = new Set((userAchievements?.data ?? []).map((a) => a.id))
  const all = allAchievements?.data ?? []

  return (
    <div className="space-y-6">
      {/* Points summary */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="rounded-full bg-orange-100 p-4">
            <Star className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Мои очки</p>
            <p className="text-3xl font-bold">{points?.points ?? 0}</p>
          </div>
          <div className="ml-8">
            <p className="text-sm text-muted-foreground">Достижений</p>
            <p className="text-3xl font-bold">{userAchievements?.count ?? 0}</p>
          </div>
        </CardContent>
      </Card>

      {/* Achievement grid */}
      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Достижений пока нет</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((a) => (
            <AchievementCard key={a.id} achievement={a} earned={earnedIds.has(a.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function GamificationPage() {
  const { user } = useAuth()

  const role = (user?.role ?? "student").toLowerCase()
  const isAdminOrTeacher =
    user?.is_superuser || role === "admin" || role === "teacher"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">
          Геймификация
        </h1>
        <p className="text-muted-foreground">
          {isAdminOrTeacher
            ? "Управление достижениями и наградами"
            : "Мои достижения и очки"}
        </p>
      </div>

      {isAdminOrTeacher ? (
        <AdminGamification />
      ) : (
        user && <StudentGamification userId={user.id} />
      )}
    </div>
  )
}
