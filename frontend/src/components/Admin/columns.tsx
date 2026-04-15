import type { ColumnDef } from "@tanstack/react-table"

import type { UserPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserActionsMenu } from "./UserActionsMenu"

export type UserTableData = UserPublic & {
  isCurrentUser: boolean
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  teacher: "Преподаватель",
  student: "Студент",
  ADMIN: "Администратор",
  TEACHER: "Преподаватель",
  STUDENT: "Студент",
}

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  teacher: "outline",
  student: "secondary",
  ADMIN: "default",
  TEACHER: "outline",
  STUDENT: "secondary",
}

export const columns: ColumnDef<UserTableData>[] = [
  {
    accessorKey: "full_name",
    header: "ФИО",
    cell: ({ row }) => {
      const fullName = row.original.full_name
      return (
        <div className="flex items-center gap-2">
          <span className={cn("font-medium", !fullName && "text-muted-foreground")}>
            {fullName || "—"}
          </span>
          {row.original.isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              Вы
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Роль",
    cell: ({ row }) => {
      const role = row.original.role
      if (row.original.is_superuser) {
        return <Badge variant="default">Суперпользователь</Badge>
      }
      const label = role ? (ROLE_LABELS[role] ?? role) : "Студент"
      const variant = role ? (ROLE_VARIANTS[role] ?? "secondary") : "secondary"
      return <Badge variant={variant}>{label}</Badge>
    },
  },
  {
    accessorKey: "is_active",
    header: "Статус",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 rounded-full",
            row.original.is_active ? "bg-green-500" : "bg-gray-400",
          )}
        />
        <span className={row.original.is_active ? "" : "text-muted-foreground"}>
          {row.original.is_active ? "Активен" : "Неактивен"}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Действия</span>,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <UserActionsMenu user={row.original} />
      </div>
    ),
  },
]
