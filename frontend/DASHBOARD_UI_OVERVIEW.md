# Dashboard UI Overview

## 📦 Что было создано

Полная система компонентов для премиального интерфейса платформы мониторинга и автоматизации образовательных учреждений.

## 🎨 Эстетическое направление

**Refined Minimalism with Subtle Sophistication**

- ✨ Чистые линии и простая геометрия
- 🎭 Спокойная цветовая палитра (нейтральный синий)
- 📐 Щедрое белое пространство
- 🎬 Плавные микровзаимодействия (300-400ms)
- 🌓 Полная поддержка dark mode

## 📂 Структура компонентов

```
frontend/src/components/Dashboard/
├── DashboardLayout.tsx         # Основной контейнер, сетки, заголовки
├── MetricCard.tsx              # Карточки с метриками и трендами
├── EntityCard.tsx              # Универсальные карточки (студенты, группы)
├── InstitutionCard.tsx         # Специфичные карточки учреждений
├── AnalyticsCard.tsx           # Контейнер для графиков
├── DataTable.tsx               # Универсальная таблица
├── SidebarNav.tsx              # Боковая навигация
├── DashboardPage.tsx           # Главная страница (готовый пример)
├── StudentsPage.tsx            # Страница студентов (готовый пример)
├── InstitutionsPage.tsx        # Страница учреждений (готовый пример)
├── EXAMPLES.tsx                # 8 полных примеров использования
├── dashboard.css               # Анимации и спецэффекты
├── index.ts                    # Экспорты всех компонентов
├── COMPONENTS.md               # Документация каждого компонента
├── DESIGN_GUIDE.md             # Полный гайд по дизайну и системе
├── INTEGRATION.md              # Примеры интеграции с API
└── README.md                   # Основная документация
```

## 🎯 Ключевые компоненты

### 1. **MetricCard** — Метрики с трендами
```tsx
<MetricCard
  icon={Users}
  label="Студентов"
  value="2,543"
  change={{ value: 12, trend: "up" }}
  variant="success"
/>
```
**Особенности:**
- 4 варианта: default, success, warning, danger
- Поддержка трендов (up/down)
- Интерактивные иконки (масштабируются при hover)
- Приглушённые цветовые акценты

### 2. **EntityCard** — Карточки сущностей
```tsx
<EntityCard
  title="Группа 10-A"
  description="Информатика"
  badge={{ label: "25 студентов" }}
  stats={[
    { label: "Курсов", value: "18" },
    { label: "Оценка", value: "8.5" }
  ]}
  onClick={() => navigate(...)}
/>
```
**Особенности:**
- Градиент фон (image или placeholder)
- Бейджи для быстрого статуса
- Два столбца статистики
- Hover-индикатор для кликабельности

### 3. **DataTable** — Универсальная таблица
```tsx
<DataTable
  data={students}
  searchable
  columns={[
    { key: "name", label: "Имя", width: "200px" },
    {
      key: "progress",
      label: "Прогресс",
      render: (value) => <ProgressBar value={value} />
    }
  ]}
/>
```
**Особенности:**
- Встроенный поиск
- Кастомные render функции
- Hover rows с легкой подсветкой
- Responsive дизайн

### 4. **SidebarNav** — Боковая навигация
```tsx
<SidebarLayout navItems={defaultNavItems}>
  {/* Контент */}
</SidebarLayout>
```
**Особенности:**
- Активный статус для текущей страницы
- Бейджи с числами (уведомления)
- Плавные переходы между состояниями
- Компактное меню выхода

## 🎬 Анимации

### Стаггированное появление
Карточки появляются поочередно с задержкой:
```
Card 1: 100ms
Card 2: 200ms
Card 3: 300ms
Card 4: 400ms
```

### Hover эффекты
- **Иконки**: scale(1.1) с transition 300ms
- **Карточки**: Легкая тень и граница становятся ярче
- **Текст**: Цвет меняется плавно
- **Progress bars**: width анимируется за 600ms

### Loading состояния
- Shimmer анимация для skeleton loaders
- Pulse эффект для дождитесь-пожалуйста элементов

## 🎨 Цветовая система

### Light Mode
- **Background**: Чистый белый
- **Primary**: Тёмный синий `oklch(0.478 0.065 222)` (#3E6E85)
- **Accent**: Светлый синий `oklch(0.93 0.03 216)` (#9CCCE8)
- **Success**: Зелёный для позитивных метрик
- **Warning**: Оранжевый для предупреждений

### Dark Mode
- **Background**: Тёмный сланец
- **Primary**: Светлый синий (инверсия)
- **Accent**: Тёмный синий (инверсия)
- **Цветовая палитра автоматически инвертируется**

## 📱 Адаптивность

### Breakpoints
- **Mobile** (< 640px): 1 колонка
- **Tablet** (640-1024px): 2 колонки
- **Desktop** (> 1024px): 3-4 колонки

### Компоненты адаптируются
- Text sizes уменьшаются на мобильных
- Padding регулируется (1.5rem mobile, 2rem desktop)
- Grid gaps уменьшаются

## 🚀 Готовые примеры

### DashboardPage
Главная панель с:
- 4 ключевыми метриками
- 2 графиками аналитики
- 4 карточками групп
- Секцией статистики с прогресс-барами

### StudentsPage
Таблица студентов с:
- Встроенным поиском
- Фильтрами и экспортом
- Цветовыми статусами
- Показателем прогресса

### InstitutionsPage
Сетка учреждений с:
- Быстрыми статистиками (всего, активных, студентов, прогресс)
- Карточками с указанием локации
- Прогресс-барами завершения
- Индикаторами активности

## 📚 Файлы документации

1. **README.md** — Основная документация, быстрый старт
2. **COMPONENTS.md** — Детальное описание каждого компонента
3. **DESIGN_GUIDE.md** — Полная система дизайна, CSS переменные, типография
4. **INTEGRATION.md** — Примеры интеграции с API, React Query, Recharts
5. **EXAMPLES.tsx** — 8 полных примеров использования

## ✨ Отличительные черты дизайна

### Что делает его трендовым
- ✅ Refined minimalism (не overdesigned)
- ✅ Премиум ощущение (не cheap)
- ✅ Плавные микровзаимодействия
- ✅ Логичная иерархия информации
- ✅ Идеальная контрастность и читаемость
- ✅ Согласованная система компонентов

### Что НЕ делает его generic AI
- ❌ Нет скучного Inter/Roboto
- ❌ Нет яркой purple gradient на белом фоне
- ❌ Нет cookie-cutter layouts
- ❌ Нет излишних анимаций
- ❌ Нет "веб-2.0" эстетики

## 🔧 Технологический стек

- **React 19** + **TypeScript** — Type-safe компоненты
- **Tailwind CSS v4** — Utility-first стилизация
- **Radix UI** — Базовые компоненты (Button, Dialog, и т.д.)
- **Lucide React** — Иконки (563+ вариантов)
- **class-variance-authority** — Масштабируемые варианты компонентов
- **clsx/tailwind-merge** — Умное объединение классов

## 📊 Возможности интеграции

### С React Query
```tsx
const { data: metrics } = useQuery({
  queryKey: ["metrics"],
  queryFn: fetchMetrics,
})
<MetricCard ... value={metrics.students} />
```

### С Recharts
```tsx
<AnalyticsCard>
  <LineChart data={data}>
    <Line dataKey="value" stroke="var(--color-primary)" />
  </LineChart>
</AnalyticsCard>
```

### С Tanstack Router
```tsx
onClick={() => navigate(`/students/${id}`)}
```

## 🎯 Использование в проекте

### Шаг 1: Импортируйте
```tsx
import { DashboardPage } from "@/components/Dashboard"
```

### Шаг 2: Добавьте в маршрут
```tsx
export const Route = createFileRoute("/_layout/")({
  component: DashboardPage,
})
```

### Шаг 3: Интегрируйте данные
```tsx
const { data } = useQuery({...})
<MetricCard value={data.count} />
```

## 🎓 Примеры для обучения

В файле **EXAMPLES.tsx** 8 полных примеров:
1. Минимальный дашборд
2. Дашборд с действиями
3. Карточки сущностей
4. Смешанный макет
5. С сайдбаром
6. Динамические метрики
7. Кастомная таблица
8. Полная страница

Используйте их как шаблоны для своего кода!

## ✅ QA Чекист

- ✅ WCAG AA доступность
- ✅ Touch targets ≥ 44x44px
- ✅ Клавиатурная навигация
- ✅ Focus states видны
- ✅ Dark mode работает
- ✅ Responsive на всех breakpoints
- ✅ Performance оптимизирован
- ✅ Все типы заданы (TypeScript)

## 🚀 Готово к использованию!

Система полностью готова к использованию в реальном проекте. Просто импортируйте компоненты и начните интегрировать с вашими данными.

**Стартовая точка**: `frontend/src/components/Dashboard/README.md`

---

**Создано с использованием frontend-design skill** 🎨
