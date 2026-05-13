/**
 * EXAMPLES.tsx
 *
 * Примеры использования Dashboard компонентов.
 * Используйте эти примеры как шаблоны для вашего кода.
 */

import React from "react"
import {
  Users,
  BookOpen,
  Building2,
  Activity,
  Plus,
  Filter,
  Download,
  TrendingUp,
  Award,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DashboardLayout,
  DashboardContainer,
  DashboardHeader,
  DashboardGrid,
  MetricCard,
  EntityCard,
  DataTable,
  InstitutionCard,
  SidebarLayout,
  defaultNavItems,
} from "@/components/Dashboard"

// ──────────────────────────────────────────────────────────────────────────
// Пример 1: Минимальный дашборд
// ──────────────────────────────────────────────────────────────────────────

export function MinimalDashboard() {
  return (
    <DashboardLayout>
      <DashboardContainer>
        <DashboardHeader
          title="Панель управления"
          subtitle="Добро пожаловать в вашу платформу обучения"
        />

        {/* 3 ключевые метрики */}
        <DashboardGrid cols={3}>
          <MetricCard
            icon={Users}
            label="Активные студенты"
            value="2,543"
            variant="success"
          />
          <MetricCard
            icon={BookOpen}
            label="Курсов"
            value="47"
          />
          <MetricCard
            icon={Building2}
            label="Учреждений"
            value="8"
          />
        </DashboardGrid>
      </DashboardContainer>
    </DashboardLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Пример 2: Дашборд с действиями
// ──────────────────────────────────────────────────────────────────────────

export function DashboardWithActions() {
  return (
    <DashboardLayout>
      <DashboardContainer>
        <DashboardHeader
          title="Студенты"
          subtitle="Управление списком студентов"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Фильтр
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
            </div>
          }
        />

        {/* Таблица студентов */}
        <DataTable
          title="Все студенты"
          data={[
            {
              id: "1",
              name: "Иван Петров",
              email: "ivan@school.ru",
              status: "active",
            },
            {
              id: "2",
              name: "Мария Иванова",
              email: "maria@school.ru",
              status: "completed",
            },
          ]}
          searchable
          columns={[
            { key: "name", label: "Имя", width: "200px" },
            { key: "email", label: "Email", width: "250px" },
            {
              key: "status",
              label: "Статус",
              render: (value) => (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  {value}
                </span>
              ),
            },
          ]}
        />
      </DashboardContainer>
    </DashboardLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Пример 3: Карточки с подробной информацией
// ──────────────────────────────────────────────────────────────────────────

export function EntityCardsExample() {
  return (
    <DashboardLayout>
      <DashboardContainer>
        <DashboardHeader title="Группы" />

        <DashboardGrid cols={3}>
          <EntityCard
            title="Группа 10-A"
            description="Информатика и программирование"
            badge={{ label: "25 студентов", variant: "success" }}
            stats={[
              { label: "Завершено", value: "18 курсов" },
              { label: "Оценка", value: "8.5/10" },
            ]}
            onClick={() => alert("Перейти в группу")}
          />

          <EntityCard
            title="Группа 11-B"
            description="Иностранные языки"
            badge={{ label: "22 студента", variant: "success" }}
            stats={[
              { label: "Завершено", value: "14 курсов" },
              { label: "Оценка", value: "7.9/10" },
            ]}
          />

          <EntityCard
            title="Группа 10-D"
            description="Гуманитарные науки"
            badge={{ label: "24 студента", variant: "warning" }}
            stats={[
              { label: "Завершено", value: "8 курсов" },
              { label: "Оценка", value: "7.4/10" },
            ]}
          />
        </DashboardGrid>
      </DashboardContainer>
    </DashboardLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Пример 4: Смешанный макет (метрики + таблица)
// ──────────────────────────────────────────────────────────────────────────

export function MixedLayoutExample() {
  const tableData = [
    { id: "1", institution: "Школа №1", location: "Москва", students: 450 },
    { id: "2", institution: "Лицей №5", location: "СПб", students: 380 },
    { id: "3", institution: "Гимназия №10", location: "Казань", students: 320 },
  ]

  return (
    <DashboardLayout>
      <DashboardContainer>
        <DashboardHeader title="Общая статистика" />

        {/* Верхняя строка метрик */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase">
            Ключевые показатели
          </h2>
          <DashboardGrid cols={4}>
            <MetricCard
              icon={Users}
              label="Студентов"
              value="2,543"
              change={{ value: 12, trend: "up" }}
              variant="success"
            />
            <MetricCard
              icon={BookOpen}
              label="Курсов"
              value="47"
              change={{ value: 5, trend: "up" }}
            />
            <MetricCard
              icon={Building2}
              label="Учреждений"
              value="8"
            />
            <MetricCard
              icon={Activity}
              label="Активность"
              value="1,248"
              change={{ value: 8, trend: "up" }}
              variant="success"
            />
          </DashboardGrid>
        </div>

        {/* Таблица */}
        <DataTable
          title="Учреждения"
          data={tableData}
          columns={[
            { key: "institution", label: "Учреждение", width: "250px" },
            { key: "location", label: "Расположение", width: "150px" },
            { key: "students", label: "Студентов", width: "100px", align: "center" },
          ]}
        />
      </DashboardContainer>
    </DashboardLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Пример 5: Макет с сайдбаром
// ──────────────────────────────────────────────────────────────────────────

export function SidebarLayoutExample() {
  return (
    <SidebarLayout
      navItems={defaultNavItems}
      onLogout={() => alert("Вы вышли")}
    >
      <DashboardContainer>
        <DashboardHeader
          title="Добро пожаловать"
          subtitle="Это ваша приватная панель управления"
        />
        {/* Контент здесь */}
      </DashboardContainer>
    </SidebarLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Пример 6: Динамические метрики с действиями
// ──────────────────────────────────────────────────────────────────────────

export function DynamicMetricsExample() {
  const [selectedMetric, setSelectedMetric] = React.useState<string | null>(null)

  const metrics = [
    {
      id: "students",
      icon: Users,
      label: "Студентов",
      value: "2,543",
      change: { value: 12, trend: "up" as const },
      variant: "success" as const,
    },
    {
      id: "courses",
      icon: BookOpen,
      label: "Курсов",
      value: "47",
      change: { value: 5, trend: "up" as const },
      variant: "default" as const,
    },
    {
      id: "institutions",
      icon: Building2,
      label: "Учреждений",
      value: "8",
      variant: "default" as const,
    },
    {
      id: "activity",
      icon: TrendingUp,
      label: "Активность",
      value: "↑ 18%",
      variant: "success" as const,
    },
  ]

  return (
    <DashboardLayout>
      <DashboardContainer>
        <DashboardHeader title="Метрики" />

        <DashboardGrid cols={4}>
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              icon={metric.icon}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              variant={metric.variant}
              onClick={() => setSelectedMetric(metric.id)}
            />
          ))}
        </DashboardGrid>

        {selectedMetric && (
          <div className="mt-8 p-6 bg-secondary/30 rounded-xl">
            <p className="text-sm text-muted-foreground">
              Вы выбрали: <strong>{selectedMetric}</strong>
            </p>
          </div>
        )}
      </DashboardContainer>
    </DashboardLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Пример 7: Таблица с кастомными рендерами
// ──────────────────────────────────────────────────────────────────────────

interface CustomStudent {
  id: string
  name: string
  email: string
  progress: number
  status: "active" | "completed" | "pending"
}

export function CustomTableExample() {
  const students: CustomStudent[] = [
    {
      id: "1",
      name: "Иван Петров",
      email: "ivan@school.ru",
      progress: 85,
      status: "active",
    },
    {
      id: "2",
      name: "Мария Иванова",
      email: "maria@school.ru",
      progress: 92,
      status: "active",
    },
    {
      id: "3",
      name: "Александр Смирнов",
      email: "alex@school.ru",
      progress: 100,
      status: "completed",
    },
  ]

  return (
    <DashboardLayout>
      <DashboardContainer>
        <DataTable<CustomStudent>
          title="Студенты с прогрессом"
          data={students}
          searchable
          columns={[
            { key: "name", label: "Имя", width: "200px" },
            { key: "email", label: "Email", width: "250px" },
            {
              key: "progress",
              label: "Прогресс",
              width: "200px",
              render: (progress) => (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{progress}%</span>
                </div>
              ),
            },
            {
              key: "status",
              label: "Статус",
              render: (status) => {
                const colors = {
                  active: "bg-green-100 text-green-700",
                  completed: "bg-blue-100 text-blue-700",
                  pending: "bg-yellow-100 text-yellow-700",
                }
                return (
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      colors[status as CustomStudent["status"]]
                    }`}
                  >
                    {status}
                  </span>
                )
              },
            },
          ]}
          onRowClick={(student) => {
            alert(`Кликнули на: ${student.name}`)
          }}
        />
      </DashboardContainer>
    </DashboardLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Пример 8: Полная страница с несколькими секциями
// ──────────────────────────────────────────────────────────────────────────

export function FullPageExample() {
  return (
    <DashboardLayout>
      <DashboardContainer>
        {/* Заголовок */}
        <DashboardHeader
          title="Панель администратора"
          subtitle="Полное управление платформой"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Новый элемент
              </Button>
            </div>
          }
        />

        {/* Секция 1: Метрики */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase">
            Статистика
          </h2>
          <DashboardGrid cols={4}>
            <MetricCard
              icon={Users}
              label="Студентов"
              value="2,543"
              change={{ value: 12, trend: "up" }}
              variant="success"
            />
            <MetricCard
              icon={BookOpen}
              label="Курсов"
              value="47"
              change={{ value: 5, trend: "up" }}
            />
            <MetricCard
              icon={Award}
              label="Сертификатов"
              value="342"
              change={{ value: 23, trend: "up" }}
              variant="success"
            />
            <MetricCard
              icon={BarChart3}
              label="Активность"
              value="↑ 18%"
              variant="default"
            />
          </DashboardGrid>
        </div>

        {/* Секция 2: Карточки */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase">
            Последние группы
          </h2>
          <DashboardGrid cols={3}>
            <EntityCard
              title="Группа 10-A"
              description="Информатика"
              badge={{ label: "25", variant: "success" }}
              stats={[
                { label: "Курсов", value: "18" },
                { label: "Оценка", value: "8.5" },
              ]}
            />
            <EntityCard
              title="Группа 11-B"
              description="Языки"
              badge={{ label: "22", variant: "success" }}
              stats={[
                { label: "Курсов", value: "14" },
                { label: "Оценка", value: "7.9" },
              ]}
            />
            <EntityCard
              title="Группа 10-D"
              description="Гуманитарные"
              badge={{ label: "24", variant: "warning" }}
              stats={[
                { label: "Курсов", value: "8" },
                { label: "Оценка", value: "7.4" },
              ]}
            />
          </DashboardGrid>
        </div>

        {/* Секция 3: Таблица */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-6 uppercase">
            Все учреждения
          </h2>
          <DashboardGrid cols={3}>
            <InstitutionCard
              name="Школа №1"
              location="Москва"
              studentCount={450}
              completionRate={88}
              isActive={true}
            />
            <InstitutionCard
              name="Лицей №5"
              location="СПб"
              studentCount={380}
              completionRate={92}
              isActive={true}
            />
            <InstitutionCard
              name="Гимназия №10"
              location="Казань"
              studentCount={320}
              completionRate={75}
              isActive={true}
            />
          </DashboardGrid>
        </div>
      </DashboardContainer>
    </DashboardLayout>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Экспортируем все примеры для использования
// ──────────────────────────────────────────────────────────────────────────

export const examples = [
  {
    name: "Минимальный дашборд",
    component: MinimalDashboard,
  },
  {
    name: "Дашборд с действиями",
    component: DashboardWithActions,
  },
  {
    name: "Карточки сущностей",
    component: EntityCardsExample,
  },
  {
    name: "Смешанный макет",
    component: MixedLayoutExample,
  },
  {
    name: "С сайдбаром",
    component: SidebarLayoutExample,
  },
  {
    name: "Динамические метрики",
    component: DynamicMetricsExample,
  },
  {
    name: "Кастомная таблица",
    component: CustomTableExample,
  },
  {
    name: "Полная страница",
    component: FullPageExample,
  },
]
