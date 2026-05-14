# Development Notes — Education Process Platform

## Статус как на May 15, 2026

### ✅완료됨(Completed)

**Backend:**
- ✅ Все основные CRUD эндпоинты работают (users, programs, groups, enrollments, progress, lessons)
- ✅ Analytics dashboard endpoints: stats, groups progress, lagging students, top students
- ✅ Admission request processing (approve → auto enroll)
- ✅ Gamification (points, achievements)
- ✅ Attendance tracking с автоматическим обновлением progress
- ✅ RBAC (admin, teacher, student роли)

**Frontend:**
- ✅ Authentication (login, logout)
- ✅ Admin dashboard (сводная статистика, списки групп, отстающих студентов, топ студентов)
- ✅ Teacher: управление своими группами, выставление прогресса
- ✅ Student: личный кабинет, список программ с прогрессом
- ✅ Admission requests: список и одобрение заявок с автозачислением
- ✅ Program catalog (публичный список программ)
- ✅ Lessons calendar (CRUD занятий, отметка посещаемости)
- ✅ Achievements display (полученные достижения и очки)
- ✅ Individual recommendations (текстовое поле для преподавателя)

**Database:**
- ✅ 11 таблиц полностью настроены (user, program, module, group, enrollment, progress, lesson, admissionrequest, achievement, userachievement, userpoints, attendance)
- ✅ Все foreign keys и relationships корректны
- ✅ PostgreSQL с volume для persistence

**Infrastructure:**
- ✅ Docker Compose с 6 сервисами (backend, frontend, db, proxy, adminer, mailcatcher)
- ✅ Все контейнеры здоровы и запускаются без ошибок
- ✅ Swagger API docs доступна на /docs

---

### ❌ Удалено (Removed)

**Attendance Export to PDF** (May 15, 2026)
- ❌ Была попытка реализации PDF экспорта группы с посещаемостью
- ❌ Удалено из-за проблем с jsPDF и Cyrillic encoding
- ❌ Не входило в требования CLAUDE.md, был extra feature
- 📄 Подробно: см. SESSION_MAY_15_EXPORT_REMOVAL.md

---

### ⚠️ TODO / Post-Defense

Из CLAUDE.md п. 4 (Полировка):
- [ ] Все формы должны показывать inline-ошибки валидации (не только toast)
- [ ] Загрузки показывают spinner/skeleton (частично есть)
- [ ] Пустые состояния (если списков нет — текст "Нет данных")
- [ ] Таблицы отсортированы по умолчанию
- [ ] Mobile responsiveness (< 768px не сломана)

Из CLAUDE.md п. 3 (Что вырезать):
- ✅ Workflow согласования программ — вырезано (teacher создаёт сразу active)
- ✅ LMS-функции (файлы, видео, тесты) — не добавляли
- ✅ Leaderboard публичный — не добавляли
- ✅ Email-уведомления — не реализованы
- ✅ Honeypot — не добавляли

---

## Команды для разработки

```bash
# Запуск всего стека
docker compose up --build

# Переложить только frontend
docker compose up --build -d frontend

# Переложить только backend
docker compose up --build -d backend

# Просмотр логов
docker compose logs -f backend   # или frontend, db
docker compose logs -f

# Проверить API health
curl http://localhost:8000/api/v1/openapi.json | python3 -m json.tool

# Войти в контейнер backend
docker compose exec backend bash

# Войти в БД
docker compose exec db psql -U postgres -d app
```

---

## Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | admin |
| teacher@example.com | password123 | teacher |
| teacher2@example.com | password123 | teacher |
| student1@example.com | password123 | student |
| student2@example.com | password123 | student |

---

## Файлы конфигурации

- `/home/elenea/PycharmProjects/education-process-platform/CLAUDE.md` — техническое задание
- `/home/elenea/PycharmProjects/education-process-platform/SESSION_MAY_15_EXPORT_REMOVAL.md` — отчёт о попытке экспорта
- `/home/elenea/PycharmProjects/education-process-platform/DEVELOPMENT_NOTES.md` — этот файл
- `docker-compose.yml` — конфиг контейнеров
- `.env` / `.env.example` — переменные окружения

---

### 🟢 Admin Features (May 15, 23:30 UTC)

**Admission approval workflow:**
- ✅ При одобрении заявки выбирается группа и вызывается `approveAdmissionRequest(id, groupId)`
- ✅ Студент автоматически добавляется в выбранную группу
- ✅ UI: диалог со select'ом групп, кнопка Apply заблокирована пока не выбрана группа

**Dashboard cleanup:**
- ✅ Удалена fake ActivityFeed (5 захардкоженных событий)
- ✅ Удалены 3 мертвых useQuery вызова
- ✅ Вместо ActivityFeed: реальный мини-лист последних 5 pending заявок

**Students list page:**
- ✅ Подключена к реальным данным из `getUsers()` с фильтром `role === STUDENT`
- ✅ KPI числа вычисляются из БД (всего студентов, активные)
- ✅ Таблица упрощена: имя, email, статус (вместо mock группы/программы/балла)
- ✅ SidebarNav fixed: `/students` → `/students-sharp`

---

## Last Updated
May 15, 2026, 23:30 UTC — Admin features: approval with group select, real dashboard, real students list, frontend rebuilt
