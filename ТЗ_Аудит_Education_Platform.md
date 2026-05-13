# Техническое задание для Claude Code
## Аудит, доработка и полировка Education Process Platform

---

## 0. Контекст: что уже готово

Проект **Education Process Platform** реализован и находится в состоянии работающего прототипа:

- **Backend**: FastAPI 0.110 / Python 3.10 / SQLModel / PostgreSQL 18 — ~4 500 строк
- **Frontend**: React 19 / TypeScript / Tailwind CSS 4 — ~6 800 строк
- **Тесты**: pytest, FastAPI TestClient, более 40 тест-кейсов
- **DevOps**: Docker Compose, Nginx, multi-stage Dockerfile
- **Функционал**: полностью реализован (3 роли, CRUD, прогресс, геймификация, аналитика, заявки)

**Задача Claude Code — НЕ писать с нуля, а:**
1. Прочитать существующий код
2. Найти проблемы, баги, недоработки
3. Исправить и дополнить
4. Убедиться, что всё работает вместе

---

## 1. Порядок работы

```
Шаг 1: Разведка      — прочитать структуру, понять как всё устроено
Шаг 2: Backend аудит — найти и исправить проблемы на сервере
Шаг 3: Тесты         — запустить все тесты, починить упавшие, добавить недостающие
Шаг 4: Frontend аудит— найти и исправить проблемы на клиенте
Шаг 5: UI/UX polish  — довести интерфейс до хорошего состояния
Шаг 6: Интеграция    — убедиться, что frontend и backend работают вместе
Шаг 7: Docker        — убедиться, что сборка и запуск работают
```

---

## 2. Шаг 1: Разведка проекта

```bash
# Прочитать структуру
find . -type f -name "*.py" | head -60
find . -type f -name "*.tsx" | head -60

# Прочитать ключевые файлы
cat backend/app/main.py
cat backend/app/models/*.py
cat backend/app/api/routes/*.py
cat backend/app/core/config.py
cat backend/app/core/security.py
cat frontend/src/App.tsx
cat frontend/src/services/api.ts
cat docker-compose.yml
cat .env.example
```

**Составить мысленную карту:** какие модели есть, какие роуты, какие страницы, как они соединены.

---

## 2. Шаг 2: Backend аудит

### 2.1 Запустить проект локально и проверить

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python app/initial_data.py
uvicorn app.main:app --reload
```

Открыть `http://localhost:8000/docs` и пройтись по всем эндпоинтам вручную.

### 2.2 Чеклист проверок backend

#### Безопасность
- [ ] Пароли хэшируются через bcrypt (не хранятся в открытом виде)
- [ ] JWT содержит `sub` (user_id), `role`, `exp`
- [ ] Все защищённые роуты требуют валидный токен → 401 без него
- [ ] Admin-роуты недоступны для teacher/student → 403
- [ ] Teacher-роуты недоступны для student → 403
- [ ] Student не видит чужие данные (прогресс, зачисления)
- [ ] CORS настроен корректно (не `allow_origins=["*"]` в prod)

#### Валидация данных
- [ ] Все Pydantic-схемы имеют `Create`, `Update`, `Public` варианты
- [ ] `Update`-схемы используют `Optional` поля (PATCH-семантика)
- [ ] Входные данные не попадают в БД без валидации
- [ ] Email валидируется через `EmailStr`
- [ ] Числовые поля имеют разумные ограничения (score: 0-100, duration > 0)

#### Бизнес-логика
- [ ] Повторное зачисление в ту же группу → HTTP 409
- [ ] Удаление несуществующего объекта → HTTP 404
- [ ] Процент прохождения программы рассчитывается корректно: `завершённые_модули / всего_модулей × 100`
- [ ] При одобрении заявки создаётся enrollment (если группа указана)
- [ ] При завершении модуля начисляются очки и проверяются достижения
- [ ] Архивированная программа недоступна для новых заявок

#### API-дизайн
- [ ] Все роуты используют префикс `/api/v1/`
- [ ] HTTP-коды ответов соответствуют REST-стандарту (200/201/204/400/401/403/404/409/422)
- [ ] Ошибки возвращают `{"detail": "описание"}` на русском языке
- [ ] Списки возвращают `{"data": [...], "count": N}` (пагинация)
- [ ] GET-запросы поддерживают `skip` и `limit`

#### База данных
- [ ] Alembic миграции применяются с нуля без ошибок: `alembic upgrade head`
- [ ] Все FK снабжены `ondelete` стратегией (CASCADE или RESTRICT)
- [ ] UNIQUE constraints на месте: `(user_id, group_id)` в enrollment, `email` в user
- [ ] Индексы на часто запрашиваемых полях созданы

### 2.3 Типичные проблемы — исправить если найдены

```python
# ❌ Частая ошибка: возврат ORM-объекта напрямую вместо Pydantic-схемы
@router.get("/{id}")
def get_program(id: int, session: Session = Depends(get_session)):
    return session.get(Program, id)  # Может вернуть None → 500

# ✅ Правильно
@router.get("/{id}", response_model=ProgramPublic)
def get_program(id: int, session: Session = Depends(get_session)):
    program = session.get(Program, id)
    if not program:
        raise HTTPException(status_code=404, detail="Программа не найдена")
    return program

# ❌ Нет проверки прав владения
@router.delete("/{id}")
def delete_enrollment(id: int, current_user: User = Depends(get_current_user)):
    # Любой аутентифицированный может удалить чужое зачисление!

# ✅ Правильно — проверять владельца или роль
def delete_enrollment(id: int, current_user: User = Depends(get_current_user)):
    enrollment = session.get(Enrollment, id)
    if enrollment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет доступа")

# ❌ N+1 запросов
programs = session.exec(select(Program)).all()
for p in programs:
    modules = p.modules  # Отдельный запрос на каждую программу!

# ✅ Правильно — joinedload
from sqlalchemy.orm import joinedload
programs = session.exec(
    select(Program).options(joinedload(Program.modules))
).all()
```

---

## 3. Шаг 3: Тесты

### 3.1 Запустить существующие тесты

```bash
cd backend
pytest tests/ -v --tb=short 2>&1 | tee test_results.txt
```

**Ожидаемый результат:** все тесты зелёные. Если есть красные — починить.

### 3.2 Типичные причины падений тестов

```python
# Проблема: тесты используют реальную БД, загрязняют данные
# Решение: фикстура с rollback или отдельная тестовая БД

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine("sqlite:///:memory:", ...)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

# Проблема: хардкод токена/пользователя в тестах
# Решение: фикстуры создают пользователей и токены динамически

@pytest.fixture
def admin_token(db_session):
    user = create_test_user(db_session, role="admin")
    return create_access_token({"sub": str(user.id), "role": "admin"})
```

### 3.3 Добавить недостающие тесты

Проверить, что покрыты все сценарии из таблицы:

| Категория | Минимум тестов | Что проверять |
|---|---|---|
| Auth | 6 | вход/выход/me/неверный пароль/без токена/дубль email |
| RBAC | 6 | каждый защищённый роут с неверной ролью → 403 |
| Programs | 5 | CRUD + публикация + архивация |
| Enrollments | 4 | создание/дубликат→409/статус/видимость |
| Progress | 5 | фиксация/расчёт %/обновление оценки/права |
| Admission | 4 | подача/одобрение/отклонение/публичный доступ |
| Gamification | 5 | очки/достижения/без дублей/рейтинг/каталог |
| Business logic | 5 | граничные случаи и бизнес-правила |

**Итого: ≥ 40 тестов, все зелёные.**

### 3.4 Проверить покрытие (опционально)

```bash
pytest tests/ --cov=app --cov-report=term-missing
# Целевое покрытие: ≥ 70% по ключевым модулям (crud/, core/)
```

---

## 4. Шаг 4: Frontend аудит

### 4.1 Запустить и проверить

```bash
cd frontend
npm install
npm run dev
# Открыть http://localhost:5173
```

Войти под каждой из 3 ролей и пройти все сценарии вручную:

**Admin сценарии:**
- [ ] Создать программу → добавить 3 модуля → опубликовать
- [ ] Создать группу → назначить преподавателя
- [ ] Просмотреть заявку → одобрить → студент зачислен
- [ ] Посмотреть аналитику

**Teacher сценарии:**
- [ ] Открыть свою группу → увидеть студентов с прогрессом
- [ ] Зафиксировать прогресс студента по модулю
- [ ] Написать рекомендацию студенту

**Student сценарии:**
- [ ] Подать заявку на программу (публично, без логина)
- [ ] После зачисления — видеть программу в «Текущем обучении»
- [ ] Открыть модуль → прочитать контент → отметить завершённым
- [ ] Увидеть обновившийся прогресс-бар
- [ ] Проверить раздел достижений — очки отображаются

### 4.2 Чеклист проверок frontend

#### Защита маршрутов
- [ ] Неавторизованный пользователь при попытке открыть `/admin/*` → редирект на `/login`
- [ ] Student при попытке открыть `/admin/*` → страница 403
- [ ] После logout токен удалён из localStorage, маршруты снова заблокированы

#### Работа с API
- [ ] Все запросы используют централизованный axios-инстанс с baseURL и интерцептором токена
- [ ] При 401 ответе от сервера → автоматический logout и редирект на `/login`
- [ ] Состояния загрузки (loading spinner) показываются при запросах
- [ ] Ошибки API показываются пользователю через toast-уведомления
- [ ] После успешных операций (создать, обновить, удалить) кэш инвалидируется (React Query)

#### TypeScript
- [ ] `npm run build` завершается без ошибок TypeScript
- [ ] Нет критичного использования `as any` в местах работы с данными API
- [ ] Все пропсы компонентов типизированы

#### Формы
- [ ] Форма логина: показывает ошибку при неверных данных
- [ ] Все обязательные поля валидируются до отправки
- [ ] Кнопка submit заблокирована во время отправки (предотвращает двойной запрос)
- [ ] После успешной отправки форма очищается или закрывается

### 4.3 Типичные проблемы frontend — исправить если найдены

```tsx
// ❌ Нет обработки ошибок
const { data } = useQuery({ queryKey: ['programs'], queryFn: getPrograms })
return <div>{data.data.map(...)}</div>  // data может быть undefined!

// ✅ Правильно
const { data, isLoading, error } = useQuery(...)
if (isLoading) return <Spinner />
if (error) return <ErrorMessage error={error} />
return <div>{data?.data?.map(...) ?? []}</div>

// ❌ Токен прокидывается вручную в каждый запрос
const res = await fetch('/api/programs', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// ✅ Axios интерцептор
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ❌ Прямая мутация состояния React Query без инвалидации
await deleteProgram(id)
// Список программ не обновится!

// ✅ Инвалидация кэша
const mutation = useMutation({
  mutationFn: deleteProgram,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['programs'] })
    toast.success('Программа удалена')
  }
})
```

---

## 5. Шаг 5: UI/UX polish

### 5.1 Визуальные требования

Проверить и при необходимости доработать:

#### Дизайн-система
- [ ] Единая цветовая схема для всех 3 ролей (Admin=синий, Teacher=фиолетовый, Student=зелёный)
- [ ] Карточки с glassmorphism: `backdrop-blur`, полупрозрачный фон, мягкая тень
- [ ] Dark/Light mode переключается и сохраняется в localStorage
- [ ] Все интерактивные элементы имеют hover-эффекты (≤300ms transition)
- [ ] Loading-состояния: скелетоны или спиннеры (не пустые экраны)

#### Навигация
- [ ] Sidebar присутствует на всех авторизованных страницах
- [ ] Активный пункт меню выделен визуально
- [ ] На мобильных (≤768px) sidebar скрывается/открывается бургером
- [ ] Breadcrumbs или заголовок страницы чётко обозначают текущее местоположение

#### Таблицы и списки
- [ ] Таблицы с пагинацией (если записей > 10)
- [ ] Пустые состояния: «Нет данных» с иконкой и призывом к действию
- [ ] Статусы отображаются цветными Badge-компонентами (pending=жёлтый, approved=зелёный, rejected=красный)

#### Прогресс и геймификация
- [ ] Прогресс-бары анимированы при загрузке страницы
- [ ] Достижения: полученные яркие, заблокированные серые с замочком
- [ ] Счётчик очков с анимацией при изменении
- [ ] При получении нового достижения — toast с поздравлением и иконкой

#### Формы и модальные окна
- [ ] Все формы имеют понятные лейблы и placeholder-тексты на русском
- [ ] Ошибки валидации отображаются под полем, а не только в toast
- [ ] Подтверждение опасных действий (удаление): диалог «Вы уверены?»
- [ ] Модальные окна закрываются по Escape и клику на backdrop

### 5.2 Ключевые экраны — что должно быть

#### Admin Dashboard
```
┌─────────────────────────────────────────┐
│  4 KPI карточки (студенты/программы/    │
│  группы/заявки) с иконками и числами    │
├─────────────────┬───────────────────────┤
│  Последние      │  Топ программы        │
│  заявки (5 шт)  │  (по числу студентов) │
│  [Одобрить]     │                       │
│  [Отклонить]    │                       │
└─────────────────┴───────────────────────┘
```

#### Student Dashboard
```
┌─────────────────────────────────────────┐
│  Текущее обучение:                      │
│  [Программа 1] ████████░░ 80%  →        │
│  [Программа 2] ███░░░░░░░ 30%  →        │
├─────────────────┬───────────────────────┤
│  Ближайшие      │  Мои достижения       │
│  занятия (3)    │  🎯 ⚡ 📚 +5 others   │
│                 │  Очков: 145           │
└─────────────────┴───────────────────────┘
```

#### Страница программы (Student)
```
[Название программы]  [Прогресс: 2/5 модулей — 40%]
████████░░░░░░░░░░░░░░░░░ 40%

Модули:
✅ Модуль 1: HTML основы          [Оценка: 95]
→  Модуль 2: CSS стили            [В процессе]
   Модуль 3: JavaScript           [Не начат]
   Модуль 4: Практика             [Не начат]
   Модуль 5: Итоговый тест        [Не начат]

[Преподаватель: Иванов И.И.]
[Следующее занятие: 15 мая, 14:00]
```

### 5.3 Адаптивность

Проверить на трёх разрешениях:
- **375px** (iPhone SE) — весь контент доступен, ничего не обрезается
- **768px** (iPad) — sidebar может быть свёрнут
- **1440px** (Desktop) — оптимальное отображение, сетки в 3-4 колонки

---

## 6. Шаг 6: Интеграционная проверка

Прогнать все сценарии из таблицы приёмочного тестирования:

| № | Сценарий | Роль | Ожидаемый результат |
|---|---|---|---|
| 1 | Регистрация нового пользователя | — | Аккаунт создан, redirect на login |
| 2 | Вход в систему | Admin | Redirect на /admin/dashboard |
| 3 | Создание программы + 3 модуля | Admin | Программа в статусе draft |
| 4 | Публикация программы | Admin | Статус → approved |
| 5 | Создание группы с преподавателем | Admin | Группа видна Teacher |
| 6 | Подача заявки (публично) | — | Заявка в статусе pending |
| 7 | Одобрение заявки | Admin | Enrollment создан |
| 8 | Просмотр своей программы | Student | Список модулей, прогресс 0% |
| 9 | Открыть модуль → отметить завершённым | Student | Прогресс обновился |
| 10 | Начисление очков и достижения | Student | Очки в профиле + toast |
| 11 | Фиксация прогресса студента | Teacher | Прогресс обновился у студента |
| 12 | Аналитика по группе | Teacher | Таблица со студентами и % |
| 13 | Управление пользователями | Admin | Смена роли работает |
| 14 | Dark mode | Все | Тема переключается и сохраняется |
| 15 | Контроль доступа | — | Неверная роль → 403 |

Все 15 сценариев должны пройти успешно.

---

## 7. Шаг 7: Docker — финальная проверка

```bash
# Полная сборка с нуля
docker-compose down -v  # удалить всё, включая volumes
docker-compose up --build -d

# Дождаться старта всех сервисов
docker-compose ps

# Применить миграции и сид
docker-compose exec backend alembic upgrade head
docker-compose exec backend python app/initial_data.py

# Проверить
curl http://localhost/api/v1/programs/  # должен вернуть JSON
# Открыть http://localhost в браузере
```

**Чеклист Docker:**
- [ ] `docker-compose up --build` без ошибок сборки
- [ ] Все 4 сервиса (db, backend, frontend, nginx) запущены и healthy
- [ ] Nginx проксирует `/api/` → backend, всё остальное → frontend SPA
- [ ] SPA-маршруты работают (F5 на `/admin/programs` не даёт 404)
- [ ] PostgreSQL данные сохраняются между перезапусками (volume)
- [ ] `.env.example` содержит все переменные, нужные для запуска

### 7.1 nginx.conf — проверить конфигурацию

```nginx
server {
    listen 80;

    # API → backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Swagger docs
    location /docs {
        proxy_pass http://backend:8000/docs;
    }
    location /openapi.json {
        proxy_pass http://backend:8000/openapi.json;
    }

    # SPA — всё остальное
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;  # КРИТИЧНО для React Router
    }
}
```

---

## 8. Доработки (если не реализованы)

Проверить наличие и добавить, если отсутствует:

### 8.1 Backend

**Публичная форма заявки** — роут POST `/api/v1/admission-requests/` должен быть доступен БЕЗ токена (публично):
```python
# НЕ должно быть Depends(get_current_user)
@router.post("/", status_code=201)
def create_admission_request(request: AdmissionRequestCreate, session: SessionDep):
    ...
```

**Агрегированный прогресс** — при GET программы (для студента) возвращать `completion_percentage`:
```python
class ProgramWithProgress(ProgramPublic):
    completion_percentage: float
    modules: list[ModuleWithStatus]
```

**Рекомендации преподавателя** — если таблицы `recommendation` нет, добавить:
```python
class Recommendation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="user.id")
    student_id: int = Field(foreign_key="user.id")
    program_id: int | None = Field(default=None, foreign_key="program.id")
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**initial_data.py** — проверить, что создаёт:
- Администратор (из .env)
- 8 достижений (геймификация)
- Тестовые пользователи для демонстрации

### 8.2 Frontend

**404 и 403 страницы** — должны существовать:
```tsx
// /src/pages/shared/NotFound.tsx
// /src/pages/shared/Forbidden.tsx
```

**Публичная страница заявки** (`/apply`) — форма без авторизации:
- поля: ФИО, email, телефон, выбор программы (из списка approved)
- после отправки: «Ваша заявка принята. Мы свяжемся с вами.»

**Переключатель тем** — кнопка в header/sidebar, сохранение в localStorage:
```tsx
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  )
}
```

**Аналитика для Admin** — страница `/admin/analytics` с:
- Общая статистика (карточки)
- Таблица программ: название / студентов / средний % / завершили

---

## 9. Финальный чеклист перед сдачей

### Backend ✅
- [ ] `alembic upgrade head` работает с нуля
- [ ] `python app/initial_data.py` создаёт admin + достижения
- [ ] `uvicorn app.main:app` запускается без ошибок
- [ ] `/docs` открывается и показывает все эндпоинты
- [ ] `pytest tests/ -v` — все тесты зелёные (≥ 40 штук)
- [ ] Нет хардкода секретов в коде (всё через .env)
- [ ] RBAC работает корректно (проверено для каждой роли)

### Frontend ✅
- [ ] `npm run build` без ошибок TypeScript
- [ ] Все 3 роли имеют функциональный интерфейс
- [ ] Dark mode работает и сохраняется
- [ ] Адаптивность: 375px / 768px / 1440px
- [ ] Все API-вызовы через централизованный axios-инстанс
- [ ] Ошибки обрабатываются и показываются пользователю
- [ ] Loading-состояния присутствуют везде

### DevOps ✅
- [ ] `docker-compose up --build` работает с нуля
- [ ] Nginx корректно роутит запросы
- [ ] SPA-навигация не ломается при F5
- [ ] `.env.example` задокументирован
- [ ] `README.md` содержит инструкцию по запуску

### Качество кода ✅
- [ ] Нет закомментированного «мусорного» кода
- [ ] Нет `console.log` / `print` для отладки в prod-коде
- [ ] Комментарии к ключевым функциям присутствуют
- [ ] TypeScript без критичного `any`

---

## 10. Что НЕ нужно делать

- Не переписывать рабочий код без причины
- Не менять технологический стек
- Не добавлять новые зависимости без необходимости
- Не удалять существующие тесты
- Не трогать структуру таблиц БД (если только нет явного бага)

**Принцип: минимальные изменения с максимальным эффектом.**
