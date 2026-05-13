# 🐳 Запуск через Docker

## Быстрый старт (2 команды)

```bash
cd /home/elenea/PycharmProjects/education-process-platform

# 1️⃣ Запустить все сервисы
docker-compose up -d

# 2️⃣ Открыть в браузере
http://localhost:5173
```

**Готово!** ✅

---

## Что это запустит

```
┌─────────────────┐
│   Frontend      │ → http://localhost:5173
│   (Vite dev)    │
└────────┬────────┘
         │
┌────────▼────────┐
│   Backend       │ → http://localhost:8000
│   (FastAPI)     │
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │ → localhost:5432
│   (PostgreSQL)  │
└─────────────────┘
```

---

## 🎨 Ваш новый Dashboard

После запуска перейдите на эти страницы:

### Главная панель
```
http://localhost:5173/dashboard
```

### Студенты
```
http://localhost:5173/dashboard-students
```

### Учреждения
```
http://localhost:5173/dashboard-institutions
```

---

## 📋 Полные команды

### Запустить в фоне
```bash
docker-compose up -d
```

### Посмотреть логи
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Остановить
```bash
docker-compose down
```

### Перестроить
```bash
docker-compose up -d --build
```

---

## 🔑 Логин

После первого запуска используйте учётные данные из `.env`:

```
Email:    admin@example.com
Пароль:   changethis
```

---

## 🚀 Если нужно изменить конфиг

Отредактируйте `.env`:

```env
# localhost → ваш домен
DOMAIN=localhost

# Dev сервер frontend
FRONTEND_HOST=http://localhost:5173

# Данные БД
POSTGRES_PASSWORD=changethis
POSTGRES_USER=postgres
```

Потом:
```bash
docker-compose up -d --build
```

---

## 📊 Что видно в новом Dashboard

### `/dashboard` - Главная панель
- 4 метрики (Студенты, Курсы, Учреждения, Активность)
- 2 графика аналитики
- 4 карточки групп с рейтингами
- Статистика прогресса

### `/dashboard-students` - Таблица студентов
- Поиск по имени/email
- Фильтры
- Экспорт
- Таблица с прогресс-барами

### `/dashboard-institutions` - Учреждения
- Быстрая статистика
- Карточки учреждений
- Прогресс каждого

---

## ✅ Проверка что запустилось

```bash
# Посмотреть контейнеры
docker-compose ps

# Должны быть:
# - frontend (running)
# - backend (running)
# - db (running)
```

---

## 🔗 Ссылки

- Frontend:  http://localhost:5173
- Backend API: http://localhost:8000/api
- API Docs: http://localhost:8000/api/docs
- Adminer (БД): http://localhost:8080

---

## 🆘 Если что-то не работает

### Frontend не грузится?
```bash
docker-compose logs frontend
# Посмотрите ошибки в логах
```

### Порт уже занят?
```bash
# Измените в compose.override.yml или используйте другой порт
docker-compose down
```

### БД не подключается?
```bash
# Проверьте .env переменные
docker-compose logs db
```

---

## 🎯 Готово!

Всё просто:
1. `docker-compose up -d`
2. Откройте http://localhost:5173/dashboard
3. Смотрите новый классный UI 🎨

Вопросы? Логи помогут 👆
