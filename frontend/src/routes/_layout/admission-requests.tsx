import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { getAdmissionRequests } from "@/client/custom-api"
import type { AdmissionRequest } from "@/client/custom-types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute("/_layout/admission-requests")({
  component: AdmissionRequestsPage,
  head: () => ({
    meta: [{ title: "Заявки" }],
  }),
})

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: "Новая",
    in_review: "В рассмотрении",
    approved: "Одобрено",
    rejected: "Отклонено",
  }
  return map[status] ?? status
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "new") return "secondary"
  if (status === "in_review") return "default"
  if (status === "approved") return "outline"
  if (status === "rejected") return "destructive"
  return "secondary"
}

function RequestsTable({ requests }: { requests: AdmissionRequest[] }) {
  if (requests.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Заявок нет
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ФИО заявителя</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Дата заявки</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => (
          <TableRow key={req.id}>
            <TableCell className="font-medium">
              {req.applicant_name ?? "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {req.applicant_email ?? "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {req.responsible ?? "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {req.created_at
                ? new Date(req.created_at).toLocaleDateString("ru-RU")
                : "—"}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(req.status)}>
                {statusLabel(req.status)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function AdmissionRequestsPage() {
  const { data: allRequests, isError } = useQuery({
    queryKey: ["admission-requests", "all"],
    queryFn: () => getAdmissionRequests(),
    placeholderData: { data: [], count: 0 },
  })

  if (isError) {
    return (
      <p className="text-destructive">Ошибка загрузки заявок</p>
    )
  }

  const requests = allRequests?.data ?? []
  const newRequests = requests.filter((r) => r.status === "new")
  const inReviewRequests = requests.filter((r) => r.status === "in_review")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">Заявки</h1>
        <p className="text-muted-foreground">
          Управление заявками на поступление
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Новые
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RequestsTable requests={newRequests} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            В процессе
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RequestsTable requests={inReviewRequests} />
        </CardContent>
      </Card>
    </div>
  )
}
