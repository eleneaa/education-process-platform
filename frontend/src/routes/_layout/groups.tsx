import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"

import { getGroups, getPrograms } from "@/client/custom-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/groups")({
  component: GroupsPage,
  head: () => ({
    meta: [{ title: "Группы" }],
  }),
})

function statusLabel(status?: string | null): string {
  const map: Record<string, string> = {
    active: "Активна",
    completed: "Завершена",
    draft: "Черновик",
    archived: "Архив",
  }
  return map[status ?? ""] ?? (status ?? "—")
}

function statusVariant(
  status?: string | null,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "active") return "default"
  if (status === "completed") return "outline"
  if (status === "draft") return "secondary"
  return "secondary"
}

function GroupsPage() {
  const { user } = useAuth()
  const { data: groups, isError } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    placeholderData: { data: [], count: 0 },
  })
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: getPrograms,
    placeholderData: { data: [], count: 0 },
  })

  const role = (user?.role ?? "student").toLowerCase()
  const canManage =
    user?.is_superuser || role === "admin" || role === "teacher"

  const programMap = Object.fromEntries(
    (programs?.data ?? []).map((p) => [p.id, p.title]),
  )

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки групп</p>
  }

  const groupList = groups?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Группы</h1>
          <p className="text-muted-foreground">Учебные группы</p>
        </div>
        {canManage && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Создать группу
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Программа</TableHead>
                <TableHead>Учитель</TableHead>
                <TableHead>Студентов</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата начала</TableHead>
                <TableHead>Дата окончания</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Групп пока нет
                  </TableCell>
                </TableRow>
              ) : (
                groupList.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {programMap[g.program_id] ?? g.program_id}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {g.teacher_name ?? g.teacher_id ?? "—"}
                    </TableCell>
                    <TableCell>{g.student_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(g.status)}>
                        {statusLabel(g.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {g.start_date
                        ? new Date(g.start_date).toLocaleDateString("ru-RU")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {g.end_date
                        ? new Date(g.end_date).toLocaleDateString("ru-RU")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
