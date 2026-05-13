import {
  Users,
  BookOpen,
  Building2,
  Activity,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DashboardLayout,
  DashboardContainer,
  DashboardHeader,
  DashboardGrid,
} from "./DashboardLayout"
import { MetricCard } from "./MetricCard"
import { EntityCard } from "./EntityCard"
import { AnalyticsCard, ChartPlaceholder } from "./AnalyticsCard"

export function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContainer>
        {/* Header */}
        <DashboardHeader
          title="Панель управления"
          subtitle="Обзор вашей образовательной платформы и ключевые показатели"
          action={
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Новое учреждение
            </Button>
          }
        />

        {/* Key Metrics */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Ключевые показатели
          </h2>
          <DashboardGrid cols={4}>
            <MetricCard
              icon={Users}
              label="Всего студентов"
              value="2,543"
              change={{ value: 12, trend: "up" }}
              variant="success"
            />
            <MetricCard
              icon={BookOpen}
              label="Активные курсы"
              value="47"
              change={{ value: 5, trend: "up" }}
              variant="default"
            />
            <MetricCard
              icon={Building2}
              label="Учреждения"
              value="8"
              change={{ value: 0, trend: "up" }}
              variant="default"
            />
            <MetricCard
              icon={Activity}
              label="Активность сегодня"
              value="1,248"
              change={{ value: 8, trend: "up" }}
              variant="success"
            />
          </DashboardGrid>
        </div>

        {/* Analytics Section */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Аналитика
          </h2>
          <DashboardGrid cols={2}>
            <AnalyticsCard
              title="Динамика студентов"
              description="Количество активных студентов за последние 30 дней"
            >
              <ChartPlaceholder height={250} />
            </AnalyticsCard>
            <AnalyticsCard
              title="Распределение по курсам"
              description="Студенты по программам обучения"
            >
              <ChartPlaceholder height={250} />
            </AnalyticsCard>
          </DashboardGrid>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left Column - Students */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              Группы студентов
            </h2>
            <DashboardGrid cols={2}>
              <EntityCard
                title="Группа 10-A"
                description="Информатика и программирование"
                badge={{
                  label: "25 студентов",
                  variant: "success",
                }}
                stats={[
                  { label: "Завершено", value: "18 курсов" },
                  { label: "Средняя оценка", value: "8.5/10" },
                ]}
              />
              <EntityCard
                title="Группа 11-B"
                description="Иностранные языки"
                badge={{
                  label: "22 студента",
                  variant: "success",
                }}
                stats={[
                  { label: "Завершено", value: "14 курсов" },
                  { label: "Средняя оценка", value: "7.9/10" },
                ]}
              />
              <EntityCard
                title="Группа 9-C"
                description="Математика и физика"
                badge={{
                  label: "28 студентов",
                  variant: "default",
                }}
                stats={[
                  { label: "Завершено", value: "12 курсов" },
                  { label: "Средняя оценка", value: "8.2/10" },
                ]}
              />
              <EntityCard
                title="Группа 10-D"
                description="Гуманитарные науки"
                badge={{
                  label: "24 студента",
                  variant: "warning",
                }}
                stats={[
                  { label: "Завершено", value: "8 курсов" },
                  { label: "Средняя оценка", value: "7.4/10" },
                ]}
              />
            </DashboardGrid>
          </div>

          {/* Right Column - Stats */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              Статистика
            </h2>
            <div className="space-y-4">
              <AnalyticsCard
                title="Успешность"
                description="Процент завершения курсов"
                footer="На основе 2,543 студентов"
              >
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Завершено
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        85%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div className="h-full w-[85%] bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        В процессе
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        12%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div className="h-full w-[12%] bg-amber-500 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Не начато
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        3%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div className="h-full w-[3%] bg-slate-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </AnalyticsCard>

              <AnalyticsCard
                title="Награды"
                description="Выданные сертификаты"
              >
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-foreground">
                    342
                  </div>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                    ↑ 23 за неделю
                  </span>
                </div>
              </AnalyticsCard>
            </div>
          </div>
        </div>
      </DashboardContainer>
    </DashboardLayout>
  )
}
