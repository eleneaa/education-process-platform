import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Award, Crown, Pencil, Plus, Star, Trash2, Trophy } from "lucide-react"
import { useState } from "react"

import {
  createAchievement,
  deleteAchievement,
  getAllAchievements,
  getGroupLeaderboard,
  getGroups,
  getUserAchievements,
  getUserPoints,
  updateAchievement,
} from "@/client/custom-api"
import type { Achievement } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
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
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/gamification")({
  component: GamificationPage,
  head: () => ({
    meta: [{ title: "Геймификация" }],
  }),
})

// ─── Achievement Dialog ───────────────────────────────────────────────────────

const ICONS = ["🌱","🚀","⭐","💪","🏆","👑","🎯","🔥","💡","📚","🎓","🥇","🥈","🥉","🎖️"]

function AchievementDialog({
  open, onOpenChange, achievement,
}: { open: boolean; onOpenChange: (v: boolean) => void; achievement?: Achievement }) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const isEdit = !!achievement

  const [title, setTitle] = useState(achievement?.title ?? "")
  const [description, setDescription] = useState(achievement?.description ?? "")
  const [points, setPoints] = useState(String(achievement?.points_required ?? 100))
  const [icon, setIcon] = useState(achievement?.icon ?? "⭐")

  const mutation = useMutation({
    mutationFn: () => isEdit
      ? updateAchievement(achievement!.id, { title: title.trim(), description: description.trim() || null, points_required: parseInt(points) || 0, icon })
      : createAchievement({ title: title.trim(), description: description.trim() || null, points_required: parseInt(points) || 0, icon }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] })
      showSuccessToast(isEdit ? "Достижение обновлено" : "Достижение создано")
      onOpenChange(false)
    },
    onError: () => showErrorToast("Не удалось сохранить"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Редактировать достижение" : "Новое достижение"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) mutation.mutate() }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Иконка</Label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`text-xl p-1.5 rounded-md transition-colors ${icon === ic ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Название *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Первый шаг" required />
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Что нужно сделать" />
          </div>
          <div className="space-y-1.5">
            <Label>Очков для получения *</Label>
            <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} min={0} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Admin view ───────────────────────────────────────────────────────────────

function AdminGamification() {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [editAchievement, setEditAchievement] = useState<Achievement | null>(null)
  const [deleteAchievement_, setDeleteAchievement] = useState<Achievement | null>(null)

  const { data: achievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAllAchievements,
    placeholderData: { data: [], count: 0 },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAchievement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] })
      showSuccessToast("Достижение удалено")
      setDeleteAchievement(null)
    },
    onError: () => showErrorToast("Не удалось удалить"),
  })

  const list = (achievements?.data ?? []).slice().sort((a, b) => (a.points_required ?? 0) - (b.points_required ?? 0))

  return (
    <div className="space-y-6">
      <AchievementDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editAchievement && (
        <AchievementDialog open={!!editAchievement} onOpenChange={(o) => !o && setEditAchievement(null)} achievement={editAchievement} />
      )}
      <ConfirmDeleteDialog
        open={!!deleteAchievement_}
        onOpenChange={(o) => !o && setDeleteAchievement(null)}
        title="Удалить достижение?"
        description={`«${deleteAchievement_?.title}» будет удалено безвозвратно.`}
        onConfirm={() => deleteAchievement_ && deleteMutation.mutate(deleteAchievement_.id)}
        isPending={deleteMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Всего: {achievements?.count ?? 0} достижений</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />Добавить
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <Card key={a.id} className="group relative">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">{a.icon ?? "🏅"}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.title}</p>
                  {a.description && <p className="text-sm text-muted-foreground mt-0.5">{a.description}</p>}
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3.5 w-3.5 text-[#FF9935]" />
                    <span className="text-sm font-medium">{a.points_required ?? 0} очков</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditAchievement(a)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteAchievement(a)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Teacher view — leaderboard ───────────────────────────────────────────────

function TeacherGamification({ userId }: { userId: string }) {
  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    placeholderData: { data: [], count: 0 },
  })

  const myGroups = (groups?.data ?? []).filter((g) => g.teacher_id === userId)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")

  const firstGroupId = myGroups[0]?.id
  const groupId = selectedGroupId || firstGroupId || ""

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard", groupId],
    queryFn: () => getGroupLeaderboard(groupId),
    enabled: !!groupId,
    placeholderData: { group_id: groupId, entries: [] },
  })

  const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

  return (
    <div className="space-y-6">
      {myGroups.length > 1 && (
        <Select value={selectedGroupId || firstGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Выберите группу" />
          </SelectTrigger>
          <SelectContent>
            {myGroups.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!groupId ? (
        <p className="text-muted-foreground text-sm">У вас нет назначенных групп</p>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-[#FF9935]" />
              Рейтинг группы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(leaderboard?.entries ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
              ) : (
                (leaderboard?.entries ?? []).map((e) => (
                  <div
                    key={e.student_id}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                      e.rank === 1 ? "bg-yellow-50 border border-yellow-200" :
                      e.rank === 2 ? "bg-gray-50 border" :
                      e.rank === 3 ? "bg-orange-50 border border-orange-200" :
                      "bg-muted/30 border"
                    }`}
                  >
                    <span className="text-xl w-8 text-center shrink-0">
                      {RANK_ICONS[e.rank] ?? `#${e.rank}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.full_name ?? e.email}</p>
                      <p className="text-xs text-muted-foreground">{e.email}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-4 w-4 text-[#FF9935]" />
                      <span className="font-bold">{e.points}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── Student view ─────────────────────────────────────────────────────────────

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
  const { data: pointsData } = useQuery({
    queryKey: ["user-points", userId],
    queryFn: () => getUserPoints(userId),
    placeholderData: { user_id: userId, points: 0 },
  })

  const pts = pointsData?.points ?? 0
  const earnedIds = new Set((userAchievements?.data ?? []).map((ua) => ua.id))
  const sorted = (allAchievements?.data ?? []).slice().sort((a, b) => (a.points_required ?? 0) - (b.points_required ?? 0))
  const earned = sorted.filter((a) => earnedIds.has(a.id))
  const notEarned = sorted.filter((a) => !earnedIds.has(a.id))

  // Next achievement
  const next = notEarned[0]
  const nextProgress = next ? Math.min((pts / (next.points_required ?? 1)) * 100, 100) : 100

  return (
    <div className="space-y-6">
      {/* Points hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Star className="h-7 w-7 text-[#FF9935]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Мои очки</p>
                <p className="text-4xl font-bold">{pts}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Достижений</p>
                <p className="text-4xl font-bold">{earned.length}</p>
              </div>
            </div>

            {/* Progress to next */}
            {next && (
              <div className="flex-1 min-w-60">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">До следующего: <span className="font-medium text-foreground">{next.icon} {next.title}</span></span>
                  <span className="font-medium">{pts} / {next.points_required}</span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${nextProgress}%` }}
                  />
                </div>
              </div>
            )}
            {!next && <p className="text-sm font-medium text-primary">🎉 Все достижения получены!</p>}
          </div>
        </CardContent>
      </Card>

      {/* Earned achievements */}
      {earned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Получено</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <span className="text-2xl shrink-0">{a.icon ?? "🏅"}</span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{a.title}</p>
                  {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-[#FF9935]" />
                    <span className="text-xs font-medium">{a.points_required ?? 0} очков</span>
                  </div>
                </div>
                <Badge variant="default" className="shrink-0 ml-auto">✓</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked achievements */}
      {notEarned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Предстоит получить</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notEarned.map((a) => {
              const progress = Math.min((pts / (a.points_required ?? 1)) * 100, 100)
              const remaining = (a.points_required ?? 0) - pts
              return (
                <div key={a.id} className="flex flex-col gap-2 rounded-lg border px-4 py-3 opacity-70">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0 grayscale">{a.icon ?? "🏅"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{pts} / {a.points_required}</span>
                      <span>ещё {remaining} оч.</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/40 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Достижений пока нет</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function GamificationPage() {
  const { user } = useAuth()
  const role = (user?.role ?? "student").toLowerCase()
  const isAdmin = user?.is_superuser || role === "admin"
  const isTeacher = role === "teacher"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Геймификация</h1>
        <p className="text-muted-foreground">
          {isAdmin ? "Управление достижениями" : isTeacher ? "Рейтинг студентов" : "Мои достижения и очки"}
        </p>
      </div>

      {isAdmin ? (
        <AdminGamification />
      ) : isTeacher ? (
        user && <TeacherGamification userId={user.id} />
      ) : (
        user && <StudentGamification userId={user.id} />
      )}
    </div>
  )
}
