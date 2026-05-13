# Design Guide - Education Platform UI

## 🎨 Aesthetic Direction

**Refined Minimalism with Subtle Sophistication**

Это направление сочетает:
- Чистоту и простоту минимализма
- Премиум-ощущение изысканности
- Спокойствие и профессионализм
- Современные микровзаимодействия

## 🎯 Design Principles

### 1. Clarity Over Decoration
- Каждый элемент имеет назначение
- Белое пространство - это не пустота, это дизайн
- Нет декоративных элементов без смысла

### 2. Subtle Sophistication
- Спокойные цвета с контрастными акцентами
- Мягкие тени (не чёрные, а цветные)
- Граничные линии полупрозрачные (50-70% opacity)

### 3. Accessibility First
- Контрастность текста ≥ 4.5:1 (WCAG AA)
- Все интерактивные элементы имеют focus-state
- Поддержка клавиатурной навигации

### 4. Motion as Communication
- Анимации длительностью 300-400ms (не более)
- Cubic-bezier(0.4, 0, 0.2, 1) для плавных переходов
- Стаггирование для иерархии

## 🎭 Color System

### Light Mode (Current)
```
Background:     oklch(1 0 0)              — Pure white
Foreground:     oklch(0.2 0.01 240)       — Near black (slate)
Card:           oklch(1 0 0)              — White
Secondary:      oklch(0.96 0.004 240)     — Very light gray

Primary:        oklch(0.478 0.065 222)    — Dark blue (#3E6E85)
Accent:         oklch(0.93 0.03 216)      — Light blue (#9CCCE8)
Muted:          oklch(0.965 0.003 240)    — Muted gray
```

### Dark Mode
```
Background:     oklch(0.165 0.015 240)    — Near black
Foreground:     oklch(0.95 0.005 240)     — Near white
Card:           oklch(0.215 0.018 240)    — Slate 800
Secondary:      oklch(0.27 0.018 240)     — Slate 700

Primary:        oklch(0.793 0.057 216)    — Light blue (inverted)
Accent:         oklch(0.32 0.04 222)      — Dark slate blue
```

### Semantic Colors
```
Success:        oklch(0.65 0.1 130)       — Emerald
Warning:        oklch(0.73 0.15 55)       — Amber
Danger:         oklch(0.66 0.15 27)       — Red
Info:           oklch(0.65 0.08 220)      — Blue
```

## 📐 Typography

### Font Stack
```
Display:  'Geometria', sans-serif
Body:     'Geometria', 'Inter', system-ui
Code:     'Menlo', 'Monaco', monospace
```

### Scale
```
h1:       3rem (48px)  — Page titles
h2:       2rem (32px)  — Section headers
h3:       1.5rem (24px) — Card titles
Body:     1rem (16px)  — Default text
Small:    0.875rem (14px) — Secondary text
Tiny:     0.75rem (12px)  — Labels
```

### Weight System
```
Regular:  400  — Body text
Medium:   500  — Secondary headings, buttons
Bold:     700  — Primary headings, emphasis
```

## 🔲 Spacing System

```
xs:  0.25rem (4px)
sm:  0.5rem (8px)
md:  1rem (16px)
lg:  1.5rem (24px)
xl:  2rem (32px)
2xl: 3rem (48px)
```

### Card Padding
- Mobile: 1.5rem (24px)
- Desktop: 2rem (32px)

### Grid Gap
- Mobile: 1rem (16px)
- Desktop: 2rem (32px)

## 🎪 Border Radius

```
sm:  0.375rem (6px)   — Small elements
md:  0.5rem (8px)     — Default (buttons, inputs)
lg:  0.875rem (14px)  — Cards
xl:  1.25rem (20px)   — Large cards, modals
full: 9999px          — Pills, avatars
```

## 🎬 Motion Guide

### Timing Functions
```
Ease-out:  cubic-bezier(0.4, 0, 0.2, 1)  — Enter animations
Ease-in:   cubic-bezier(0.4, 0.14, 1, 1) — Exit animations
Linear:    linear                         — Progress bars
```

### Durations
```
Micro:     150ms  — Hover states
Short:     300ms  — Card transitions
Medium:    500ms  — Modal opens
Long:      800ms  — Page transitions
```

### Examples
```css
/* Smooth card hover */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Progress bar animation */
width transition: 600ms cubic-bezier(0.4, 0, 0.2, 1);

/* Staggered entry */
animation: slideUp 500ms cubic-bezier(0.4, 0, 0.2, 1) both;
animation-delay: calc(var(--index) * 100ms);
```

## 🎯 Component Patterns

### Metric Card Pattern
```
Icon (12x12) → Label → Value → Badge → Subtle hover shadow
```

### Entity Card Pattern
```
Image/Gradient → Badge + Menu → Title → Description → Stats → Hover arrow
```

### Analytics Card Pattern
```
Title + Action → Description → Chart/Content → Footer with metadata
```

### Data Table Pattern
```
Header (Title + Search) → Table (Hover rows) → Footer (Pagination)
```

## 🌈 Gradient Usage

**Subtle background gradients** для визуального интереса:
```css
/* Card backgrounds */
to-secondary/20              — Очень мягкий градиент
to-primary/5                 — Минимальный акцент
from-primary/10 to-transparent — Направленный градиент
```

**Не используйте**:
- Яркие радужные градиенты
- Диагональные градиенты в основном фоне
- Несколько наложенных градиентов

## 🔍 Interactive States

### Hover
- Border: +5% opacity increase
- Shadow: +1 уровень тени
- Transform: scale(1.02) только для кликабельных элементов

### Focus
- Outline: 2px solid primary
- Outline-offset: 2px

### Active
- Background: +10% darker
- Transform: scale(0.98)

### Disabled
- Opacity: 50%
- Cursor: not-allowed
- Pointer-events: none

## 📱 Responsive Breakpoints

```
sm:  640px   — Mobile
md:  768px   — Tablet
lg:  1024px  — Desktop
xl:  1280px  — Wide desktop
```

## ✅ QA Checklist

- [ ] Text contrast ≥ 4.5:1
- [ ] Touch targets ≥ 44x44px
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Motion respects prefers-reduced-motion
- [ ] Loads in < 2s (First Paint)
- [ ] Works in light and dark modes
- [ ] Responsive on all breakpoints

## 🎨 Future Enhancement Ideas

- [ ] Add gradient mesh backgrounds для дополнительной визуальности
- [ ] Implement scroll-triggered animations
- [ ] Add custom cursor for interactive elements
- [ ] Create premium animations for key moments
- [ ] Добавить микрогравитацию для карточек (parallax light)
