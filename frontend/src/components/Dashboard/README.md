# 🎨 Dashboard Components - Education Platform UI

Современная, премиальная система дизайна для платформы мониторинга и автоматизации образовательных учреждений.

## ✨ Особенности

- 🎭 **Refined Minimalism** — чистый дизайн без излишеств
- 📱 **Полностью адаптивный** — работает на всех устройствах
- 🎬 **Плавные анимации** — микровзаимодействия для лучшего UX
- 🌓 **Dark Mode** — встроенная поддержка темной темы
- ♿ **Accessible** — WCAG AA compliance
- 📊 **TypeScript** — полная типизация
- ⚡ **Performance** — оптимизированные компоненты

## 🚀 Быстрый старт

### 1. Импортируйте компоненты

```tsx
import {
  DashboardLayout,
  DashboardContainer,
  DashboardHeader,
  DashboardGrid,
  MetricCard,
  EntityCard,
  DataTable,
} from "@/components/Dashboard"
```

### 2. Создайте страницу

```tsx
import { DashboardPage } from "@/components/Dashboard"

export function MyDashboard() {
  return <DashboardPage />
}
```

### 3. Интегрируйте с маршрутами

```tsx
// routes/_layout.tsx
import { DashboardPage } from "@/components/Dashboard"

export const Route = createFileRoute("/_layout/")({
  component: DashboardPage,
})
```

## 📚 Основные компоненты

### MetricCard
Карточка с метриками, трендами и вариантами.

```tsx
<MetricCard
  icon={Users}
  label="Всего студентов"
  value="2,543"
  change={{ value: 12, trend: "up" }}
  variant="success"
/>
```

### EntityCard
Универсальная карточка для сущностей (студенты, группы, курсы).

```tsx
<EntityCard
  title="Группа 10-A"
  description="Информатика"
  badge={{ label: "25 студентов", variant: "success" }}
  stats={[
    { label: "Курсов", value: "18" },
    { label: "Оценка", value: "8.5/10" },
  ]}
  onClick={() => navigate(`/groups/1`)}
/>
```

### DataTable
Таблица с поиском, сортировкой и кастомными рендерами.

```tsx
<DataTable
  data={students}
  searchable
  columns={[
    { key: "name", label: "Имя", width: "200px" },
    { key: "email", label: "Email", width: "250px" },
    {
      key: "status",
      label: "Статус",
      render: (value) => <Badge>{value}</Badge>,
    },
  ]}
  onRowClick={(student) => navigate(`/students/${student.id}`)}
/>
```

### AnalyticsCard
Контейнер для графиков и аналитики.

```tsx
<AnalyticsCard title="Динамика студентов" description="За 30 дней">
  <Chart data={data} />
</AnalyticsCard>
```

## 📱 Примеры страниц

### DashboardPage
```tsx
import { DashboardPage } from "@/components/Dashboard"

<DashboardPage />
```
Главная панель управления с ключевыми метриками.

### StudentsPage
```tsx
import { StudentsPage } from "@/components/Dashboard"

<StudentsPage />
```
Таблица студентов с поиском и статистикой.

### InstitutionsPage
```tsx
import { InstitutionsPage } from "@/components/Dashboard"

<InstitutionsPage />
```
Сетка учреждений с показателями.

## 🎨 Цветовая палитра

Система основана на OKLCH цветах:

| Цвет | Значение | Использование |
|------|----------|---------------|
| Primary | `oklch(0.478 0.065 222)` | Основной акцент (тёмный синий) |
| Accent | `oklch(0.93 0.03 216)` | Светлый синий, акценты |
| Success | `oklch(0.65 0.1 130)` | Позитивные метрики |
| Warning | `oklch(0.73 0.15 55)` | Предупреждения |
| Danger | `oklch(0.66 0.15 27)` | Ошибки, критическое |

## 🎬 Анимации

Все компоненты поддерживают плавные переходы:

- **Hover Effects** — иконки масштабируются, тени меняются
- **Entry Animations** — стаггированное появление
- **Progress Animations** — плавное заполнение прогресс-баров
- **Loading States** — шиммер-анимация

```css
/* Используется для всех переходов */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

## 🌓 Dark Mode

Компоненты автоматически поддерживают тёмную тему:

```tsx
import { useTheme } from "@/components/theme-provider"

export function ThemeSwitcher() {
  const { setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme("dark")}>
      Тёмная тема
    </button>
  )
}
```

## 📊 Интеграция с данными

### С React Query

```tsx
const { data: metrics } = useQuery({
  queryKey: ["metrics"],
  queryFn: () => fetch("/api/metrics").then(r => r.json()),
})

<MetricCard
  icon={Users}
  label="Студентов"
  value={metrics?.students || 0}
/>
```

### С Recharts

```tsx
import { LineChart, Line, ResponsiveContainer } from "recharts"

<AnalyticsCard title="Тренды">
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <Line dataKey="value" stroke="var(--color-primary)" />
    </LineChart>
  </ResponsiveContainer>
</AnalyticsCard>
```

## 🔗 Структура файлов

```
components/Dashboard/
├── DashboardLayout.tsx      # Основные компоненты макета
├── MetricCard.tsx           # Карточка метрик
├── EntityCard.tsx           # Карточка сущности
├── InstitutionCard.tsx      # Карточка учреждения
├── AnalyticsCard.tsx        # Карточка аналитики
├── DataTable.tsx            # Таблица данных
├── SidebarNav.tsx           # Боковая навигация
├── DashboardPage.tsx        # Главная страница
├── StudentsPage.tsx         # Страница студентов
├── InstitutionsPage.tsx     # Страница учреждений
├── dashboard.css            # Анимации и стили
├── index.ts                 # Экспорты
├── COMPONENTS.md            # Документация компонентов
├── DESIGN_GUIDE.md          # Гайд по дизайну
├── INTEGRATION.md           # Гайд по интеграции
└── README.md                # Этот файл
```

## ✅ Чек-лист внедрения

- [ ] Импортируйте Dashboard компоненты
- [ ] Интегрируйте DashboardPage в основной маршрут
- [ ] Добавьте StudentsPage и InstitutionsPage маршруты
- [ ] Подключите SidebarNav к навигации
- [ ] Протестируйте в light и dark режимах
- [ ] Проверьте адаптивность на мобильных
- [ ] Интегрируйте реальные данные через API
- [ ] Добавьте графики через Recharts
- [ ] Настройте цвета под фирменный стиль (если нужно)

## 🎯 Кастомизация

### Изменение цветов

Отредактируйте `src/index.css`:

```css
:root {
  --primary: oklch(0.5 0.08 200);  /* Ваш цвет */
  /* ... другие переменные */
}
```

### Расширение компонентов

```tsx
import { MetricCard } from "@/components/Dashboard/MetricCard"

export function CustomMetricCard(props) {
  return (
    <MetricCard
      {...props}
      className="custom-class"
    />
  )
}
```

## 🧪 Тестирование

```tsx
import { render, screen } from "@testing-library/react"
import { MetricCard } from "@/components/Dashboard"

test("MetricCard renders correctly", () => {
  render(
    <MetricCard
      icon={Users}
      label="Студентов"
      value="100"
    />
  )
  expect(screen.getByText("Студентов")).toBeInTheDocument()
})
```

## 📖 Дополнительные ресурсы

- **[COMPONENTS.md](./COMPONENTS.md)** — Документация каждого компонента
- **[DESIGN_GUIDE.md](./DESIGN_GUIDE.md)** — Полный гайд по дизайну
- **[INTEGRATION.md](./INTEGRATION.md)** — Примеры интеграции с реальными данными

## 🚀 Performance

- Используйте React.memo для оптимизации
- Лениво загружайте компоненты в маршрутизаторе
- Кэшируйте запросы с React Query
- Мониторьте Web Vitals

## 🐛 Troubleshooting

**Компоненты не отображаются:**
- Убедитесь, что импортированы из правильного пути
- Проверьте, что Tailwind CSS подключен
- Посмотрите консоль браузера на ошибки

**Стили не применяются:**
- Убедитесь, что `cn()` функция импортирована из `@/lib/utils`
- Проверьте, что Tailwind конфигурация верна
- Очистите кэш браузера

**Dark mode не работает:**
- Убедитесь, что ThemeProvider обёрнут вокруг приложения
- Проверьте классы `.dark` на HTML элементе

## 📝 Лицензия

MIT

## 👤 Автор

Создано для платформы мониторинга образования с использованием React, TypeScript и Tailwind CSS.

---

**Готово к использованию!** 🎉

Начните с импорта `DashboardPage` и интегрируйте в ваш проект.
