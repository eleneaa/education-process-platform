import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { BookOpen, Plus } from "lucide-react"

import { getModules, getPrograms } from "@/client/custom-api"
import type { Program } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/programs")({
  component: ProgramsPage,
  head: () => ({
    meta: [{ title: "Программы" }],
  }),
})

function statusLabel(status?: string | null): string {
  if (!status) return "Активна"
  const map: Record<string, string> = {
    active: "Активна",
    draft: "Черновик",
    archived: "Архив",
  }
  return map[status] ?? status
}

function statusVariant(
  status?: string | null,
): "default" | "secondary" | "outline" {
  if (status === "active" || !status) return "default"
  if (status === "draft") return "secondary"
  return "outline"
}

function ProgramCard({ program, moduleCount }: { program: Program; moduleCount: number }) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-md bg-orange-100 p-2 shrink-0">
              <BookOpen className="h-4 w-4 text-orange-600" />
            </div>
            <CardTitle className="text-base leading-tight truncate">
              {program.title}
            </CardTitle>
          </div>
          <Badge variant={statusVariant(program.status)} className="shrink-0">
            {statusLabel(program.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-2">
        {program.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {program.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{moduleCount} модулей</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgramsPage() {
  const { user } = useAuth()
  const { data: programs, isError } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })
  const { data: modules } = useQuery({
    queryKey: ["modules"],
    queryFn: () => getModules(),
    placeholderData: { data: [], count: 0 },
  })

  const role = (user?.role ?? "student").toLowerCase()
  const canCreate =
    user?.is_superuser || role === "admin" || role === "teacher"

  const moduleCounts = (modules?.data ?? []).reduce<Record<string, number>>(
    (acc, m) => {
      acc[m.program_id] = (acc[m.program_id] ?? 0) + 1
      return acc
    },
    {},
  )

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки программ</p>
  }

  const programList = programs?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">
            Программы
          </h1>
          <p className="text-muted-foreground">
            Образовательные программы платформы
          </p>
        </div>
        {canCreate && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Создать программу
          </Button>
        )}
      </div>

      {programList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Программ пока нет</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programList.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              moduleCount={moduleCounts[p.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
