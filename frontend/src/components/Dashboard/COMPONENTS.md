# Dashboard Components

Современная и премиальная система компонентов для образовательной платформы. Ориентирована на чистоту, простоту и элегантность.

## 🎨 Design Philosophy

- **Refined Minimalism**: Чистые линии, нейтральная палитра, белое пространство
- **No AI Slop**: Каждый компонент продуман и имеет назначение
- **Accessibility**: Полная поддержка клавиатуры и скрин-ридеров
- **Performance**: Оптимизированные анимации с использованием GPU

## 📦 Components

### Layout Components

#### `DashboardLayout`
Основная обёртка с поддержкой градиента фона и декоративных элементов.

```tsx
import { DashboardLayout, DashboardContainer, DashboardHeader } from "@/components/Dashboard"

<DashboardLayout>
  <DashboardContainer>
    <DashboardHeader 
      title="Панель управления"
      subtitle="Описание"
      action={<Button>Действие</Button>}
    />
  </DashboardContainer>
</DashboardLayout>
```

#### `DashboardGrid`
Адаптивная сетка с поддержкой 1, 2, 3 и 4 колонок.

```tsx
<DashboardGrid cols={3}>
  {/* Cards */}
</DashboardGrid>
```

### Card Components

#### `MetricCard`
Карточка с метриками и трендами.

**Props:**
- `icon: LucideIcon` - Иконка компонента
- `label: string` - Название метрики
- `value: string | number` - Значение
- `change?: { value: number, trend: "up" | "down" }` - Тренд
- `variant?: "default" | "success" | "warning" | "danger"` - Стиль
- `onClick?: () => void` - Обработчик клика

```tsx
<MetricCard
  icon={Users}
  label="Всего студентов"
  value="2,543"
  change={{ value: 12, trend: "up" }}
  variant="success"
/>
```

#### `EntityCard`
Универсальная карточка для студентов, групп, курсов.

**Props:**
- `title: string` - Название
- `description?: string` - Описание
- `badge?: { label: string, variant: "success" | "warning" | "default" }` - Бейдж
- `stats?: Array<{ label: string, value: string }>` - Статистика
- `onClick?: () => void` - Обработчик клика
- `onMoreClick?: () => void` - Обработчик меню

```tsx
<EntityCard
  title="Группа 10-A"
  description="Информатика"
  badge={{ label: "25 студентов", variant: "success" }}
  stats={[
    { label: "Курсов", value: "18" },
    { label: "Оценка", value: "8.5/10" }
  ]}
  onClick={() => navigate(`/groups/1`)}
/>
```

#### `InstitutionCard`
Компактная карточка для учреждений с прогресс-баром.

```tsx
<InstitutionCard
  name="Школа №1"
  location="Москва"
  studentCount={450}
  completionRate={88}
  isActive={true}
/>
```

#### `AnalyticsCard`
Контейнер для графиков и аналитики.

```tsx
<AnalyticsCard
  title="Динамика студентов"
  description="За последние 30 дней"
  footer="Обновлено 5 минут назад"
>
  <Chart data={data} />
</AnalyticsCard>
```

### Data Component

#### `DataTable`
Универсальная таблица с поиском и сортировкой.

```tsx
interface Student {
  id: string
  name: string
  email: string
  status: "active" | "completed"
}

<DataTable<Student>
  title="Студенты"
  data={students}
  searchable
  onRowClick={(student) => navigate(`/students/${student.id}`)}
  columns={[
    { key: "name", label: "Имя" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Статус",
      render: (value) => <Badge>{value}</Badge>
    }
  ]}
/>
```

## 🎯 Color Palette

Используется система OKLCH цветов для совместимости и гибкости:

```css
--primary: oklch(0.478 0.065 222);      /* Dark blue */
--accent: oklch(0.93 0.03 216);         /* Light blue */
--foreground: oklch(0.2 0.01 240);      /* Dark text */
--secondary: oklch(0.96 0.004 240);     /* Light gray */
--muted: oklch(0.965 0.003 240);        /* Muted */
```

## 🔄 Animations

Все компоненты поддерживают плавные переходы:

- **Hover Effects**: Масштабирование иконок, изменение теней
- **Entry Animations**: Стаггированные появления карточек
- **Progress Transitions**: Плавное заполнение прогресс-баров
- **Loading States**: Шиммер-анимация для skeleton loaders

## 📱 Responsive Design

Все компоненты адаптивны:

- Mobile: 1 колонка
- Tablet: 2 колонки
- Desktop: 3-4 колонки

## 🌓 Dark Mode

Полная поддержка тёмной темы через `next-themes`:

```tsx
import { useTheme } from "@/components/theme-provider"

const { setTheme } = useTheme()
```

## 📊 Example Pages

### Dashboard Page
Главная панель с все ключевыми метриками, аналитикой и быстрым доступом.

```tsx
import { DashboardPage } from "@/components/Dashboard"

<DashboardPage />
```

### Students Page
Таблица студентов с поиском, фильтрацией и экспортом.

```tsx
import { StudentsPage } from "@/components/Dashboard"

<StudentsPage />
```

### Institutions Page
Сетка учреждений с статистикой.

```tsx
import { InstitutionsPage } from "@/components/Dashboard"

<InstitutionsPage />
```

## 🚀 Usage Tips

1. **Используйте grid для макетов** - `DashboardGrid` обрабатывает адаптивность
2. **Варьируйте варианты карточек** - Используйте `variant` для визуального разнообразия
3. **Добавляйте микровзаимодействия** - Используйте `onClick` для интерактивности
4. **Кастомизируйте render функции** - Используйте render props в `DataTable` для сложных ячеек

## 📝 TypeScript Support

Все компоненты полностью типизированы:

```tsx
// Тип автоматически выводится
<MetricCard<Props>
  icon={Icons.User}
  // IDE покажет все доступные props
/>
```
