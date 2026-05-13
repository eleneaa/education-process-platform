# Dashboard UI - Интеграция Чек-лист

## 📋 Быстрая интеграция (5 минут)

### 1. Импортируйте главный компонент
```tsx
// frontend/src/routes/_layout.tsx
import { DashboardPage } from "@/components/Dashboard"

export const Route = createFileRoute("/_layout/")({
  component: DashboardPage,
})
```

### 2. (Опционально) Добавьте страницы студентов и учреждений
```tsx
// frontend/src/routes/_layout/students.tsx
import { StudentsPage } from "@/components/Dashboard"
export const Route = createFileRoute("/_layout/students")({
  component: StudentsPage,
})

// frontend/src/routes/_layout/institutions.tsx
import { InstitutionsPage } from "@/components/Dashboard"
export const Route = createFileRoute("/_layout/institutions")({
  component: InstitutionsPage,
})
```

### 3. Протестируйте
```bash
cd frontend
npm run dev
# Откройте http://localhost:5173
```

**Готово!** ✅

---

## 🎨 Кастомизация (дополнительно)

### Измените цвета
Отредактируйте `frontend/src/index.css`:
```css
:root {
  /* Измените PRIMARY цвет */
  --primary: oklch(0.5 0.08 200);  /* Ваш цвет */
  
  /* Остальные цвета... */
}
```

### Измените шрифт
```css
/* frontend/src/index.css */
body {
  font-family: 'YourFont', 'Geometria', system-ui;
}
```

### Добавьте свой лого
Обновите SidebarNav в `frontend/src/components/Dashboard/SidebarNav.tsx`:
```tsx
<h1 className="text-2xl font-bold text-foreground">
  {/* Ваше лого вместо текста */}
  <YourLogo />
</h1>
```

---

## 🔗 Интеграция с реальными данными

### Получение данных через API
```tsx
import { useQuery } from "@tanstack/react-query"
import { DashboardLayout, DashboardContainer, MetricCard } from "@/components/Dashboard"

export function MyDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: () => fetch("/api/metrics").then(r => r.json()),
  })

  return (
    <DashboardLayout>
      <DashboardContainer>
        <MetricCard
          icon={Users}
          label="Студентов"
          value={metrics?.students || 0}
        />
      </DashboardContainer>
    </DashboardLayout>
  )
}
```

### Таблица со студентами
```tsx
import { DataTable } from "@/components/Dashboard"

export function StudentsTable() {
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => fetch("/api/students").then(r => r.json()),
  })

  return (
    <DataTable
      data={students}
      columns={[
        { key: "name", label: "Имя" },
        { key: "email", label: "Email" },
        { key: "status", label: "Статус" },
      ]}
      onRowClick={(student) => navigate(`/students/${student.id}`)}
    />
  )
}
```

---

## 📊 Добавление графиков (Recharts)

```tsx
import { AnalyticsCard } from "@/components/Dashboard"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

export function MyChart() {
  const data = [
    { month: "Jan", value: 400 },
    { month: "Feb", value: 430 },
    // ...
  ]

  return (
    <AnalyticsCard title="Тренды" description="За 30 дней">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Line type="monotone" dataKey="value" stroke="var(--color-primary)" />
        </LineChart>
      </ResponsiveContainer>
    </AnalyticsCard>
  )
}
```

---

## 🧭 Навигация между страницами

### Обновите сайдбар
```tsx
import { SidebarNav, defaultNavItems } from "@/components/Dashboard"

export function Layout() {
  const navItems = [
    ...defaultNavItems,
    {
      label: "Мой пункт",
      icon: CustomIcon,
      href: "/my-page",
    },
  ]

  return (
    <SidebarNav items={navItems} onLogout={() => {...}} />
  )
}
```

### Или используйте встроенный layout
```tsx
import { SidebarLayout } from "@/components/Dashboard"

export function AppLayout({ children }) {
  return (
    <SidebarLayout onLogout={handleLogout}>
      {children}
    </SidebarLayout>
  )
}
```

---

## 🌓 Включение Dark Mode

```tsx
import { useTheme } from "@/components/theme-provider"

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  )
}
```

---

## 📱 Тестирование адаптивности

```bash
# Открыть DevTools (F12)
# Ctrl+Shift+M — Toggle Device Toolbar
# Протестировать на:
# - Mobile (375px)
# - Tablet (768px)
# - Desktop (1280px)
```

---

## 🧪 Запуск примеров

```tsx
import { examples } from "@/components/Dashboard"

export function ExamplesShowcase() {
  return (
    <div>
      {examples.map((example) => (
        <div key={example.name}>
          <h2>{example.name}</h2>
          <example.component />
        </div>
      ))}
    </div>
  )
}
```

---

## 🔐 Добавление авторизации

```tsx
export const Route = createFileRoute("/_layout/dashboard")({
  component: DashboardPage,
  beforeLoad: async ({ context }) => {
    if (!context.auth?.isLoggedIn) {
      throw redirect({ to: "/login" })
    }
  },
})
```

---

## 🐛 Решение проблем

### Компоненты не отображаются
- ✅ Проверьте path импорта: `@/components/Dashboard`
- ✅ Убедитесь что `@` alias работает
- ✅ Посмотрите консоль браузера на ошибки

### Стили не применяются
- ✅ Tailwind CSS подключен в `src/index.css`?
- ✅ `src/index.css` импортирован в `src/main.tsx`?
- ✅ Очистите кэш браузера (Ctrl+Shift+Delete)

### Dark mode не работает
- ✅ ThemeProvider обёрнут вокруг приложения?
- ✅ Проверьте классы `.dark` на html элементе
- ✅ `next-themes` установлен?

---

## 📚 Дополнительные ресурсы

| Файл | Описание |
|------|---------|
| `README.md` | Основная документация |
| `COMPONENTS.md` | Описание каждого компонента |
| `DESIGN_GUIDE.md` | Полная система дизайна |
| `INTEGRATION.md` | Примеры интеграции |
| `EXAMPLES.tsx` | 8 полных примеров |
| `DASHBOARD_UI_OVERVIEW.md` | Обзор всей системы |

---

## ✅ Готово!

Компоненты полностью интегрированы и готовы к использованию.

**Начните с**: `frontend/src/components/Dashboard/README.md`

**Или сразу используйте**: 
```tsx
import { DashboardPage } from "@/components/Dashboard"
```

---

## 💬 Поддержка

Если нужна помощь:
1. Проверьте документацию в `/components/Dashboard/`
2. Посмотрите примеры в `EXAMPLES.tsx`
3. Прочитайте `DESIGN_GUIDE.md` для деталей о системе

**Дизайн создан как production-ready система** — готов к использованию в реальных проектах! 🚀
