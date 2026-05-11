import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Search, Bell, Filter } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts"

import { getPrograms, getAdmissionRequests, getGroups } from "@/client/custom-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: DashboardSharp,
  head: () => ({
    meta: [{ title: "Обзор" }],
  }),
})

// ─── Components ────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="divider-h border-b sticky top-0 bg-background z-40">
      <div className="flex items-center justify-between px-10 py-5 gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-mute" />
          <Input
            placeholder="⌘K поиск..."
            className="border-0 bg-transparent text-sm placeholder:text-mute focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Eyebrow({ number = "001", title = "ОБЗОР" }) {
  return (
    <div className="flex items-center justify-between text-sm px-10 py-4">
      <div className="eyebrow">
        № {number} — {title}
      </div>
      <div className="eyebrow text-right">
        {new Date().toLocaleDateString("ru-RU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  )
}

function HeroSection() {
  const { user } = useAuth()
  return (
    <div className="px-10 py-8">
      <h1 className="display-hero mb-4">
        Сегодня в системе — <em className="not-italic text-accent font-medium">12 845</em>{" "}
        активных студентов.
      </h1>
      <p className="body-md text-mute max-w-2xl italic">
        Платформа работает стабильно. Все показатели в норме. Последнее обновление 2 часа назад.
      </p>
    </div>
  )
}

interface KPICardProps {
  label: string
  value: string | number
  delta?: string
  deltaType?: "positive" | "negative"
  footer?: string
  sparkline?: number[]
}

function KPICard({ label, value, delta, deltaType, footer, sparkline }: KPICardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="label-sm">{label}</div>
        {delta && (
          <div className={`chip-sharp ${deltaType === "positive" ? "chip-success" : "chip-error"}`}>
            {deltaType === "positive" ? "+" : ""}
            {delta}
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {sparkline && (
        <div className="h-7 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline.map((v, i) => ({ value: v }))} margin={{ top: 2, right: 2, left: 0, bottom: 2 }}>
              <Line type="monotone" dataKey="value" stroke="var(--accent)" dot={false} strokeWidth={1.5} />
              <Tooltip contentStyle={{ display: "none" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {footer && <div className="kpi-footer">{footer}</div>}
    </div>
  )
}

function KPISection() {
  return (
    <div className="px-10">
      <div className="kpi-grid">
        <KPICard
          label="СТУДЕНТЫ"
          value="12 845"
          delta="4,2%"
          deltaType="positive"
          footer="было 12 327 / 30д"
          sparkline={[100, 120, 110, 130, 140, 125, 135, 145, 140, 150, 155, 160]}
        />
        <KPICard
          label="ПРОГРАММЫ"
          value="84"
          delta="2"
          deltaType="positive"
          footer="актуальных / 92"
          sparkline={[80, 82, 81, 83, 84, 84, 84, 84, 84, 84, 84, 84]}
        />
        <KPICard
          label="ЗАЯВКИ"
          value="312"
          delta="12,5%"
          deltaType="positive"
          footer="в процессе / 2 847"
          sparkline={[250, 270, 290, 305, 310, 312, 312, 312, 312, 312, 312, 312]}
        />
        <KPICard
          label="СРЕДНИЙ БАЛЛ"
          value="7,8"
          delta="0,3"
          deltaType="negative"
          footer="на начало семестра"
          sparkline={[7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8]}
        />
      </div>
    </div>
  )
}

function ChartSection() {
  const lineData = [
    { month: "Янв", applications: 400, enrolled: 240 },
    { month: "Фев", applications: 520, enrolled: 380 },
    { month: "Мар", applications: 680, enrolled: 510 },
    { month: "Апр", applications: 720, enrolled: 580 },
    { month: "Май", applications: 850, enrolled: 720 },
    { month: "Июн", applications: 920, enrolled: 850 },
    { month: "Июл", applications: 880, enrolled: 780 },
    { month: "Авг", applications: 950, enrolled: 890 },
    { month: "Сен", applications: 1020, enrolled: 950 },
    { month: "Окт", applications: 1100, enrolled: 1020 },
    { month: "Ноя", applications: 1200, enrolled: 1100 },
    { month: "Дек", applications: 1350, enrolled: 1250 },
  ]

  const donutData = [
    { name: "Бакалавриат", value: 45, color: "var(--accent)" },
    { name: "Магистратура", value: 28, color: "var(--pos)" },
    { name: "Специалитет", value: 15, color: "#4f46e5" },
    { name: "ДПО", value: 12, color: "#8b5cf6" },
  ]

  const topPrograms = [
    { name: "Информатика", value: 95 },
    { name: "Экономика", value: 88 },
    { name: "Право", value: 72 },
    { name: "Психология", value: 68 },
    { name: "История", value: 65 },
    { name: "Филология", value: 62 },
  ]

  return (
    <div className="px-10 py-12 space-y-12">
      <div className="grid grid-cols-3 gap-8">
        {/* Line Chart */}
        <div className="col-span-2 card-sharp p-6">
          <h3 className="heading-sm mb-6">Поступления и зачисления</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hair)" />
              <XAxis dataKey="month" stroke="var(--mute)" style={{ fontSize: "12px" }} />
              <YAxis stroke="var(--mute)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--hair)" }}
                labelStyle={{ color: "var(--fg)" }}
              />
              <Line type="monotone" dataKey="applications" stroke="var(--accent)" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="enrolled"
                stroke="var(--mute)"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="card-sharp p-6">
          <h3 className="heading-sm mb-6">Распределение</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-xs">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-mute">{item.name}</span>
                </div>
                <span className="mono font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Programs */}
      <div className="card-sharp p-6">
        <h3 className="heading-sm mb-6">Топ программ по успеваемости</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topPrograms} margin={{ top: 5, right: 30, left: 150, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--hair)" />
            <XAxis type="number" stroke="var(--mute)" style={{ fontSize: "12px" }} />
            <YAxis dataKey="name" type="category" width={140} stroke="var(--mute)" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--hair)" }}
              labelStyle={{ color: "var(--fg)" }}
            />
            <Bar dataKey="value" fill="var(--accent)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ActivityFeed() {
  const activities = [
    { time: "14:02", title: "Зачислено новых студентов", detail: "в программу Информатика", tag: "ПРИЁМ", tagType: "accent" },
    { time: "12:45", title: "Завершена проверка заявок", detail: "этап документов", tag: "ДОКУМЕНТ", tagType: "outline" },
    { time: "11:20", title: "Обновлена программа обучения", detail: "Экономика 2024", tag: "ПРОГРАММА", tagType: "outline" },
    { time: "09:15", title: "Отчисление студента", detail: "в связи с неуспеваемостью", tag: "УХОД", tagType: "error" },
    { time: "08:30", title: "Синхронизация с внешней ИС", detail: "завершена успешно", tag: "СИНК", tagType: "success" },
  ]

  return (
    <div className="px-10 py-12">
      <div className="card-sharp p-6">
        <h3 className="heading-sm mb-6">Поток активности</h3>
        <div className="space-y-0">
          {activities.map((activity, i) => (
            <div key={i} className={`py-4 px-4 flex items-start gap-4 ${i > 0 ? "divider-h border-t" : ""}`}>
              <div className="mono text-xs text-mute flex-shrink-0 w-12">{activity.time}</div>
              <div className="flex-1 min-w-0">
                <div className="heading-sm leading-tight">{activity.title}</div>
                <div className="text-sm text-mute">{activity.detail}</div>
              </div>
              <div className={`chip-sharp chip-${activity.tagType} flex-shrink-0`}>{activity.tag}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div className="divider-h border-t mt-12">
      <div className="px-10 py-6 text-xs eyebrow text-center">API Sync · Last update 2 minutes ago
      </div>
    </div>
  )
}

function DashboardSharp() {
  const { user } = useAuth()

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: () => getPrograms(),
  })

  const { data: admissions } = useQuery({
    queryKey: ["admissions"],
    queryFn: () => getAdmissionRequests({ skip: 0, limit: 10 }),
  })

  const { data: groups } = useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroups(),
  })

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Eyebrow />
      <HeroSection />
      <KPISection />
      <ChartSection />
      <ActivityFeed />
      <Footer />
    </div>
  )
}
