import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DashboardLayout,
  DashboardContainer,
  DashboardHeader,
  DashboardGrid,
} from "./DashboardLayout"
import { InstitutionCard } from "./InstitutionCard"

interface Institution {
  id: string
  name: string
  location: string
  studentCount: number
  completionRate: number
  isActive: boolean
}

const sampleInstitutions: Institution[] = [
  {
    id: "1",
    name: "Школа №1 им. Ленина",
    location: "Москва",
    studentCount: 450,
    completionRate: 88,
    isActive: true,
  },
  {
    id: "2",
    name: "Лицей №5",
    location: "Санкт-Петербург",
    studentCount: 380,
    completionRate: 92,
    isActive: true,
  },
  {
    id: "3",
    name: "Гимназия №10",
    location: "Казань",
    studentCount: 320,
    completionRate: 75,
    isActive: true,
  },
  {
    id: "4",
    name: "Школа №15",
    location: "Новосибирск",
    studentCount: 410,
    completionRate: 81,
    isActive: true,
  },
  {
    id: "5",
    name: "Средняя школа №3",
    location: "Екатеринбург",
    studentCount: 290,
    completionRate: 68,
    isActive: false,
  },
  {
    id: "6",
    name: "Школа №8",
    location: "Краснодар",
    studentCount: 360,
    completionRate: 85,
    isActive: true,
  },
]

export function InstitutionsPage() {
  return (
    <DashboardLayout>
      <DashboardContainer>
        <DashboardHeader
          title="Учреждения"
          subtitle="Управление образовательными учреждениями и их показателями"
          action={
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              Добавить учреждение
            </Button>
          }
        />

        {/* Summary Stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-12">
          <div className="rounded-xl bg-gradient-to-br from-white to-secondary/10 dark:from-slate-800 dark:to-slate-700/50 p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Всего учреждений
            </p>
            <p className="text-2xl font-bold text-foreground">
              {sampleInstitutions.length}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white to-secondary/10 dark:from-slate-800 dark:to-slate-700/50 p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Активных
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {sampleInstitutions.filter((i) => i.isActive).length}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white to-secondary/10 dark:from-slate-800 dark:to-slate-700/50 p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Всего студентов
            </p>
            <p className="text-2xl font-bold text-foreground">
              {sampleInstitutions.reduce(
                (sum, i) => sum + i.studentCount,
                0,
              )}
            </p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white to-secondary/10 dark:from-slate-800 dark:to-slate-700/50 p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Средний прогресс
            </p>
            <p className="text-2xl font-bold text-foreground">
              {Math.round(
                sampleInstitutions.reduce(
                  (sum, i) => sum + i.completionRate,
                  0,
                ) / sampleInstitutions.length,
              )}
              %
            </p>
          </div>
        </div>

        {/* Institutions Grid */}
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          Список учреждений
        </h2>
        <DashboardGrid cols={3}>
          {sampleInstitutions.map((institution) => (
            <InstitutionCard
              key={institution.id}
              name={institution.name}
              location={institution.location}
              studentCount={institution.studentCount}
              completionRate={institution.completionRate}
              isActive={institution.isActive}
              onClick={() => {
                console.log("Click institution:", institution)
              }}
            />
          ))}
        </DashboardGrid>
      </DashboardContainer>
    </DashboardLayout>
  )
}
