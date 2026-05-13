# Handoff: Editorial Admin — Education Platform

## Overview
Полный редизайн админ-панели платформы администрирования образовательного процесса в editorial-минимализме. Цель — современный, не «топорный» интерфейс с поддержкой светлой и тёмной темы, который сочетает крупную типографику, воздух и плотные таблицы/данные там, где они нужны.

## About the Design Files
Файлы в этом бандле — **дизайн-референсы, сделанные в HTML/React/JSX**. Это прототипы, показывающие задуманный вид и поведение, **а не production-код для прямого копирования**.

Задача — **воспроизвести этот дизайн в существующем кодовом окружении проекта**: React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (`frontend/src/components/ui/*`) + Tanstack Router (`frontend/src/routes/_layout/*`). Все JSX в этом бандле написаны как plain JSX (без типов, без shadcn-обёрток) — переписать на компоненты из `components/ui/*` (`<Card>`, `<Button>`, `<Badge>`, `<Table>`, и т.д.) с подключением shadcn-вариантов.

Шрифт **Geometria** уже подключён через `@font-face` в `frontend/src/index.css` — нужно положить `.woff2` в `frontend/public/fonts/`. В прототипе использован Manrope как визуально близкий fallback из Google Fonts.

## Fidelity
**High-fidelity (hifi)**. Финальные цвета, типографика, отступы, компоновка зафиксированы. Воспроизводить пиксельно, используя shadcn-компоненты из существующего кода. Адаптировать под Tailwind v4 (тема уже частично описана в `frontend/src/index.css` — нужно заменить её на новые токены из этого README).

---

## Дизайн-направление: «Sharp»
Редакционный, не топорный минимализм. Ориентир — независимые журналы и data-driven публикации.

Принципы:
- **Крупная типографика-герой** на главных экранах (clamp 56–72px), light/300 weight, отрицательный letter-spacing.
- **Hairline-разделители** (1px, низкоконтрастные) вместо тяжёлых границ и теней.
- **Моноширинные метки**: маленькие индексы секций (`№ 001`, `02`), даты, числа в таблицах, KPI-дельты. Все заглавными с разрядкой `0.06–0.14em`.
- **Сетка-полоса** для KPI: 4–6 ячеек в одну линию, разделённые вертикальными hairline-границами, без скруглений у самой полосы.
- **Карточки** — мягкие (radius 14px), border 1px hairline, без теней, плоские поверхности.
- **Акцент** — янтарный охровый, используется точечно: активные элементы навигации, тренды-плюс, выделение «героя» в заголовке (`<em>` тег).

---

## Design Tokens

### Цвета — Light (`theme-sharp-light`)
```css
--bg: #ffffff;
--fg: #0a0a0c;
--mute: #6e6e76;
--hair: rgba(10, 10, 12, 0.10);
--surface-1: #ffffff;
--surface-2: #f5f5f4;
--accent: oklch(0.62 0.16 58);   /* янтарный охр */
--accent-line: oklch(0.62 0.16 58 / 0.40);
--pos: oklch(0.48 0.10 145);     /* зелёный для трендов */
--pos-line: oklch(0.48 0.10 145 / 0.35);
--neg: oklch(0.55 0.18 28);
--neg-line: oklch(0.55 0.18 28 / 0.35);
```

### Цвета — Dark (`theme-sharp-dark`)
```css
--bg: #0a0a0c;
--fg: #f4f4f5;
--mute: #8a8a93;
--hair: rgba(244, 244, 245, 0.10);
--surface-1: #111114;
--surface-2: rgba(244, 244, 245, 0.05);
--accent: oklch(0.76 0.14 62);
--accent-line: oklch(0.76 0.14 62 / 0.40);
--pos: oklch(0.78 0.12 145);
--neg: oklch(0.72 0.16 28);
```

### Типографика
- **Display**: `Geometria` → fallback `Manrope`, `system-ui`.
- **Mono**: `JetBrains Mono` (для индексов, числовых ячеек таблиц, дельт, дат).
- **Размеры**: 64/52/36/28/22/18/14/13.5/12/11.5/11/10.5/10.
- **Веса**: 300 (display), 400, 500, 600.
- **Letter-spacing**: `-0.04em` для крупных дисплейных, `-0.01em` для middle, `+0.06–0.14em uppercase` для меток.
- **Числа**: всегда `font-variant-numeric: tabular-nums` в таблицах и KPI.

### Spacing / Radius
- Скругления: card `14px`, chip/tag/button `999px`, mark `4px`.
- Padding страницы: `40px` по горизонтали, `28px` вертикальной секции.
- Gap между карточками: `20–28px`.
- Toolbar: `22px 40px`, разделители — hairline снизу.

---

## Screens / Views

### 01. Обзор / Dashboard (`Dashboard` в `dashboard.jsx`)
**Назначение**: Главная страница админа — сводка по платформе.

**Layout** (сверху вниз):
1. **Topbar** — хлебные крошки + поиск (`⌘K`) + кнопки-иконки (фильтр, уведомления с точкой акцента). Высота ~78px, border-bottom hairline.
2. **Eyebrow** — строка-метка `№ 001 — ОБЗОР` слева, дата/семестр/неделя справа (mono, uppercase, 12px, разрядка `0.04–0.06em`).
3. **H1-герой** — двухстрочный заголовок 64px/light, с выделением метрики через `<em>` (акцентный цвет, weight 500). Например: `Сегодня в системе — 12 845 активных студентов.` Italic-фраза второй строкой.
4. **Подзаголовок** — 14px, mute, max-width 620px.
5. **KPI-полоса** (4 колонки) — Студенты / Программы / Заявки / Средний балл. Каждая ячейка:
   - метка ВВЕРХУ uppercase 10.5px + delta-чип (`+4,2%` зелёный, `-12%` красный) справа,
   - крупное число 52px/300/-0.04em letter-spacing,
   - sparkline 28px высотой (line + опционально fill 8% opacity),
   - foot-строка «было 12 327 / 30д».
6. **Section 02 — Динамика и распределение** (`grid-3`, 1.6fr + 1fr):
   - **Line chart** «Поступления и зачисления» — 12 месяцев, две серии (заявки — solid accent с fill 8%, зачисленные — dashed 50% mute). Подпись пика через выноску с рамкой.
   - **Donut** «Распределение по направлениям» — 5 сегментов, толщина 14px, в центре сумма + ВСЕГО mono. Под донатом — список с swatch + label + value (mono).
7. **Section 02 продолжение** (`grid-2`):
   - **Bars** «Топ программ по успеваемости» — 6 горизонтальных полос, accent для топ-2, mute-fg для остальных.
   - **Heatmap** «Посещаемость» — 7 рядов (дни недели, ПН-ВС) × 20 колонок (недели), `color-mix(in oklch, var(--accent) X%, transparent)`. Легенда 0→100 справа в card-head.
8. **Section 03 — Поток активности** — лента из 5 строк: `[14:02] [Заголовок события + кто] [TAG-чип]`. Border-bottom hairline между строками.
9. **Footer-rail** — mono uppercase синхронизация/API.

### 02. Студенты (`StudentsScreen`)
- H1: `Студенты — 12 845 персональных траекторий.`
- 6-колоночная KPI-полоса: ВСЕГО / АКТИВНЫЕ / СЕССИЯ / ДИПЛОМ / НА КОНТРОЛЕ / ОТЧИСЛЕНЫ.
- **Таблица студентов** в `<Card>` без padding:
  - Колонки: ID (mono), СТУДЕНТ (avatar 26px + ФИО), ГРУППА (mono), ПРОГРАММА (mute), СРЕДНИЙ БАЛЛ (правее, цветной по диапазону: ≥9 accent, <8 neg), ПРОГРЕСС (track + value mono), СТАТУС (dot + label), АКТИВНОСТЬ (мute), `⋯`.
  - Header: 10px mono uppercase разрядка `0.12em`, mute.
  - Row: 14px padding, border-bottom hairline между.
- Пагинация: `← 1 2 3 … 1071 →` чипами + `1 — 12 из 12 845` слева.
- Использовать существующий `components/Common/DataTable.tsx` как базу, заменить стиль ячеек и хедера.

### 03. Программы (`ProgramsScreen`)
- H1: `84 программы подготовки.`
- KPI-полоса 4 колонки: Бакалавриат / Магистратура / Специалитет / ДПО + % чип.
- Карточный grid 3 колонки (первая карточка `span 2` — featured).
- Карточка программы:
  - Eyebrow: `01.03.02 · Бакалавриат` (mono mute).
  - Title 20–28px/500.
  - Метка справа: статус-чип цветной (Активна = pos, На доработке = neg).
  - 3-сетка stats (СТУДЕНТОВ / ВЫПОЛНЕНО / СР. БАЛЛ), между border-top/bottom hairline.
  - Progress bar 4px высота, accent.
  - Теги внизу — чипы.

### 04. Заявки — Kanban (`ApplicationsScreen`)
- H1: `Заявки и зачисление — 312 в потоке.`
- 5 колонок: Новые → На проверке → Документы → Собеседование → Зачислено.
- Header колонки: `0X ЭТАП` (10px mute uppercase) + название (14px/500) + счётчик (mono, accent если первая колонка).
- Карточка заявки: ID + дата (mono mute), ФИО, программа, footer (форма обучения mute uppercase + warning dot если есть).
- Заглушка `+ ещё N` — dashed border, mute mono.

### 05. Учреждения (`InstitutionsScreen`)
- H1: `Сеть из 38 образовательных учреждений.`
- KPI-полоса 4 колонки.
- Grid 4 колонки карточек:
  - Верх (120px) — editorial «fascia»: репитинг 45° striped placeholder + крупный `№ 01` mono 32px/300, ниже `📍 ГОРОД` mono uppercase. Справа сверху — статус-чип цветной.
  - Низ — название института 15px/500, 2-grid stats (СТУДЕНТЫ / ПРОГРАММ, числа 22px/300), затем activity bar 4px.

---

## Components mapping → shadcn

| Дизайн               | shadcn / project                              |
|----------------------|-----------------------------------------------|
| Card / `.card`       | `components/ui/card.tsx`                       |
| Chip / `.chip`       | `components/ui/badge.tsx` (вариант `outline`)  |
| Status dot           | inline span + цвет из токенов                  |
| Sidebar              | `components/Sidebar/AppSidebar.tsx` (модификация — collapsed по умолчанию, иконки 17px stroke 1.4) |
| Topbar search        | `components/ui/input.tsx` + `components/ui/kbd` (создать) |
| Table                | `components/ui/table.tsx` или `Common/DataTable.tsx` |
| Avatar               | `components/ui/avatar.tsx` (initials fallback) |
| Progress bar         | inline `.bar-track` / `.bar-fill` или создать `components/ui/progress.tsx` |
| Sparkline / Line / Donut / Bars / Heatmap | SVG inline (см. `dashboard.jsx`), при желании Recharts |

## Interactions & Behavior
- **Sidebar collapse**: hover-расширение или toggle-кнопка. В прототипе по умолчанию свёрнут (`width: 72px`), expanded `248px`.
- **Hover**: чипы — `border-color: var(--fg)`, ссылки навигации — фон `var(--surface-2)`.
- **Активная вкладка** в сайдбаре: `surface-2` фон + `accent` цвет иконки и счётчика.
- **Анимации**: только subtle 200ms ease-out на цвет/фон. Без bounce.
- **Адаптив**: prototype рассчитан на 1440. Для меньших — KPI-полоса в 2 колонки, charts стек.

## Data Fetching
- `MetricCard` data — из `/api/v1/dashboard/metrics`.
- Студенты — `/api/v1/students?page=1&size=12` (см. `client/sdk.gen.ts`).
- Programs — `/api/v1/programs`.
- Applications — `/api/v1/applications?group_by=stage`.
- Все — через TanStack Query (паттерн уже в `hooks/useAuth.ts`).

## Files in this bundle
- `Education Platform Dashboard.html` — единая точка входа, использует design canvas для side-by-side просмотра всех экранов.
- `styles.css` — все CSS-переменные и общие классы. Перенести в `frontend/src/index.css` как `:root.theme-sharp-light` / `.dark`.
- `dashboard.jsx` — Dashboard (Обзор) + Sidebar + графики (LineChart, Donut, Heatmap, Sparkline).
- `screens.jsx` — StudentsScreen, ProgramsScreen, ApplicationsScreen, InstitutionsScreen.
- `icons.jsx` — hairline SVG-иконки. В реальном коде заменить на `lucide-react` (уже в зависимостях).
- `design-canvas.jsx` — служебный компонент для презентации, в продакшн не идёт.

## Что НЕ копировать в продакшн
- `design-canvas.jsx`, обёртки `<DCSection>`/`<DCArtboard>` — это только для review.
- Inline JSX-стили — переписать в Tailwind-классы или CSS-modules.
- Mock-данные (массивы `STUDENTS`, `PROGRAMS`, `COLS`, `INSTS`) — заменить на ответ API.

## Open questions для разработчика
- Решить: оставить editorial-герой на каждой странице или только на дашборде (на остальных — компактнее)?
- Подтвердить наличие `.woff2` файлов Geometria (Regular/Medium/Bold) в `public/fonts/`.
- Применить ли editorial-стиль и к `routes/login.tsx`, `apply.tsx`? Сейчас не задизайнен.
