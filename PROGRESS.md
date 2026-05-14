# Текущий статус работы (14 мая 2026)

## ✅ Завершено

### Backend
- [x] Модель Attendance с статусами (present/absent/late)
- [x] CRUD операции (create_or_update, get_by_lesson, get_by_group, update, delete)
- [x] API endpoints: GET/POST/PATCH/DELETE /attendance
- [x] Миграция базы данных с уникальным индексом (lesson_id + student_id)
- [x] Все 152 теста проходят

### Frontend
- [x] Типы для Attendance (AttendanceStatus, Attendance, AttendancesResponse)
- [x] API клиент функции (getAttendance, createAttendance, updateAttendance, deleteAttendance)
- [x] Страница группы с тремя табами:
  - Студенты (список студентов в группе)
  - Посещаемость (таблица с кликабельными ячейками)
  - Прогресс (статус модулей и оценки)
- [x] Навигация: нажатие на карточку группы открывает детали

### Данные
- [x] Docker полностью пересобран
- [x] База инициализирована
- [x] Тестовые данные созданы (8 пользователей, 4 группы, 20+ занятий)

## 🚨 Проблема

**Страница группы не открывается при нажатии на карточку**

### Что произошло
1. Обернули Card в Link к `/groups/{groupId}`
2. Маршрут создан в `frontend/src/routes/_layout/groups.$groupId.tsx`
3. При нажатии на карточку ничего не происходит (или не видна ошибка)

### Что проверить
1. Открыть DevTools (F12) → Console - посмотреть ошибки
2. Попробовать открыть URL напрямую: `http://localhost/groups/[id-группы]`
3. Проверить, правильно ли TanStack Router распознает маршрут `$groupId`

### Возможные причины
- Проблема с синтаксисом TanStack Router (нужно проверить правильность формата `$groupId`)
- Ошибка в компоненте GroupDetailPage при загрузке данных
- Проблема с навигацией через Link

## 📁 Файлы, которые менялись

- `backend/app/models/attendance.py` - новая модель
- `backend/app/crud/crud_attendance.py` - новые CRUD операции
- `backend/app/api/routes/attendance.py` - новые API endpoints
- `backend/app/api/main.py` - регистрация маршрута
- `backend/app/models/__init__.py` - экспорт модели
- `backend/app/crud/__init__.py` - экспорт CRUD
- `backend/app/alembic/versions/7f9e9ea00e31_add_attendance_table.py` - миграция
- `frontend/src/routes/_layout/groups.$groupId.tsx` - **новая страница группы**
- `frontend/src/routes/_layout/groups.tsx` - изменена навигация на карточке
- `frontend/src/client/custom-api.ts` - добавлены функции для attendance
- `frontend/src/client/custom-types.ts` - добавлены типы для attendance

## 🔐 Credentials для тестирования

```
Учитель: teacher@example.com / password123
Админ: admin@example.com / changethis
Студент: student1@example.com / password123
```

## 🎯 Дальнейшие действия

1. Проверить почему не открывается страница группы
2. Если нужно, переделать маршрутизацию (может быть использовать `useNavigate` вместо Link)
3. Протестировать табы посещаемости и прогресса
4. Добавить возможность редактирования посещаемости (click-to-cycle)
