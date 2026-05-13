# Integration Guide

Как интегрировать новые Dashboard компоненты в существующий проект.

## 📦 Import примеры

### Основной импорт
```tsx
// Импортируйте всё нужное в одной строке
import {
  DashboardLayout,
  DashboardContainer,
  DashboardHeader,
  DashboardGrid,
  MetricCard,
  EntityCard,
  AnalyticsCard,
  DataTable,
  DashboardPage,
  StudentsPage,
  InstitutionsPage,
} from "@/components/Dashboard"
```

### Селективный импорт
```tsx
import { MetricCard } from "@/components/Dashboard/MetricCard"
import { EntityCard } from "@/components/Dashboard/EntityCard"
```

## 🔗 Интеграция с существующими маршрутами

### 1. Добавить Dashboard в главный маршрут

```tsx
// frontend/src/routes/_layout.tsx
import { DashboardPage } from "@/components/Dashboard"

export const Route = createFileRoute("/_layout/")({
  component: DashboardPage,
})
```

### 2. Студенты страница

```tsx
// frontend/src/routes/_layout/students.tsx
import { StudentsPage } from "@/components/Dashboard"

export const Route = createFileRoute("/_layout/students")({
  component: StudentsPage,
})
```

### 3. Учреждения страница

```tsx
// frontend/src/routes/_layout/institutions.tsx
import { InstitutionsPage } from "@/components/Dashboard"

export const Route = createFileRoute("/_layout/institutions")({
  component: InstitutionsPage,
})
```

## 🎨 Кастомизация компонентов

### Переопределение стилей

```tsx
import { MetricCard } from "@/components/Dashboard"
import { cn } from "@/lib/utils"

export function CustomMetricCard(props) {
  return (
    <MetricCard
      {...props}
      className={cn("custom-class", props.className)}
    />
  )
}
```

### Расширение функциональности

```tsx
import { EntityCard } from "@/components/Dashboard"

interface CustomEntityCardProps extends React.ComponentProps<typeof EntityCard> {
  customField?: string
}

export function CustomEntityCard({
  customField,
  ...props
}: CustomEntityCardProps) {
  return (
    <EntityCard {...props}>
      {customField && <div>{customField}</div>}
    </EntityCard>
  )
}
```

## 🔄 Интеграция с данными

### Использование с React Query

```tsx
import { useQuery } from "@tanstack/react-query"
import { DashboardGrid, MetricCard } from "@/components/Dashboard"
import { Users, BookOpen } from "lucide-react"

export function DashboardWithData() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: () => fetch("/api/metrics").then(r => r.json()),
  })

  return (
    <DashboardGrid cols={4}>
      <MetricCard
        icon={Users}
        label="Студентов"
        value={metrics?.students || 0}
        variant="success"
      />
      <MetricCard
        icon={BookOpen}
        label="Курсов"
        value={metrics?.courses || 0}
      />
      {/* ... */}
    </DashboardGrid>
  )
}
```

### DataTable с реальными данными

```tsx
import { DataTable } from "@/components/Dashboard"
import { useQuery } from "@tanstack/react-query"

interface Student {
  id: string
  name: string
  email: string
  status: "active" | "completed"
}

export function StudentsDataTable() {
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetch("/api/students").then(r => r.json()),
  })

  return (
    <DataTable<Student>
      data={students}
      searchable
      columns={[
        { key: "name", label: "Имя" },
        { key: "email", label: "Email" },
        { key: "status", label: "Статус" },
      ]}
      onRowClick={(student) => {
        navigate(`/students/${student.id}`)
      }}
    />
  )
}
```

## 📊 Интеграция с графиками (Recharts)

```tsx
import { AnalyticsCard, ChartPlaceholder } from "@/components/Dashboard"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

export function StudentProgressChart() {
  const data = [
    { month: "Jan", students: 400 },
    { month: "Feb", students: 430 },
    { month: "Mar", students: 480 },
    // ...
  ]

  return (
    <AnalyticsCard
      title="Динамика студентов"
      description="За последние 3 месяца"
    >
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Line type="monotone" dataKey="students" stroke="var(--color-primary)" />
        </LineChart>
      </ResponsiveContainer>
    </AnalyticsCard>
  )
}
```

## 🎯 Навигация между страницами

### Обновите sidebar для ссылок на новые компоненты

```tsx
// frontend/src/components/Sidebar/Sidebar.tsx
import { LayoutDashboard, Users, Building2 } from "lucide-react"

export function Sidebar() {
  return (
    <nav>
      <NavLink to="/" icon={LayoutDashboard}>
        Панель управления
      </NavLink>
      <NavLink to="/students" icon={Users}>
        Студенты
      </NavLink>
      <NavLink to="/institutions" icon={Building2}>
        Учреждения
      </NavLink>
    </nav>
  )
}
```

## 🔐 Защита маршрутов

Используйте существующую систему аутентификации:

```tsx
export const Route = createFileRoute("/_layout/dashboard")({
  component: DashboardPage,
  beforeLoad: async ({ context }) => {
    if (!context.auth.isLoggedIn) {
      throw redirect({ to: "/login" })
    }
  },
})
```

## 💾 Сохранение состояния

Используйте `useSearch` из TanStack Router:

```tsx
export function StudentsPage() {
  const { search } = useSearch({ from: "/_layout/students" })
  const [filter, setFilter] = useState(search?.filter || "")

  return (
    <DataTable
      data={filteredData}
      // ...
    />
  )
}
```

## 📝 Примеры готовых интеграций

### Полная страница с метриками и таблицей

```tsx
import { DashboardLayout, DashboardContainer, DashboardHeader, DashboardGrid, MetricCard, DataTable } from "@/components/Dashboard"

export function CompletePage() {
  return (
    <DashboardLayout>
      <DashboardContainer>
        <DashboardHeader title="Контрольная панель" />
        
        <DashboardGrid cols={4}>
          {/* Метрики */}
        </DashboardGrid>

        <DataTable {...tableProps} />
      </DashboardContainer>
    </DashboardLayout>
  )
}
```

### Модальное окно с EntityCard

```tsx
import { EntityCard } from "@/components/Dashboard"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export function GroupDetailModal({ groupId }) {
  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetch(`/api/groups/${groupId}`).then(r => r.json()),
  })

  return (
    <Dialog open>
      <DialogContent>
        <EntityCard
          title={group?.name}
          description={group?.description}
          stats={[...]}
        />
      </DialogContent>
    </Dialog>
  )
}
```

## 🧪 Тестирование компонентов

```tsx
import { render, screen } from "@testing-library/react"
import { MetricCard } from "@/components/Dashboard"
import { Users } from "lucide-react"

describe("MetricCard", () => {
  it("renders metric value and label", () => {
    render(
      <MetricCard
        icon={Users}
        label="Студентов"
        value="1,234"
      />
    )
    
    expect(screen.getByText("Студентов")).toBeInTheDocument()
    expect(screen.getByText("1,234")).toBeInTheDocument()
  })
})
```

## 🚀 Performance Tips

1. **Лениво загружайте компоненты**:
```tsx
const DashboardPage = React.lazy(() => 
  import("@/components/Dashboard").then(m => ({ default: m.DashboardPage }))
)
```

2. **Используйте React.memo для карточек**:
```tsx
export const MetricCard = React.memo(MetricCardComponent)
```

3. **Оптимизируйте queries**:
```tsx
useQuery({
  queryKey: ["metrics"],
  queryFn: fetchMetrics,
  staleTime: 5 * 60 * 1000, // 5 минут
})
```
