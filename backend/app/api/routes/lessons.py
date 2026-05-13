from typing import Any, Literal
from uuid import UUID, uuid4
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import SQLModel

from app.crud import crud_lesson, crud_enrollment
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin
from app.models import Lesson, LessonCreate, LessonPublic, LessonUpdate, LessonsPublic


class RecurringLessonCreate(SQLModel):
    """Creates a series of recurring lessons."""
    title: str
    description: str | None = None
    group_id: UUID
    first_date: str          # ISO date string: "2026-04-21"
    time: str                # "HH:MM"
    duration_minutes: int = 90
    location: str | None = None
    frequency: Literal["weekly", "biweekly"] = "weekly"
    count: int               # number of occurrences (1-52)

router = APIRouter(prefix="/lessons", tags=["Lessons"])


@router.get("/", response_model=LessonsPublic)
def read_lessons(
    session: SessionDep,
    current_user: CurrentUser,
    group_id: UUID | None = Query(default=None),
) -> Any:
    """
    Get lessons. Optionally filter by group_id.
    Students only see lessons for their enrolled groups.
    """
    from app.models.enums import UserRole

    if group_id:
        lessons = crud_lesson.get_lessons_by_group(session=session, group_id=group_id)
        return LessonsPublic(data=lessons, count=len(lessons))

    if current_user.role == UserRole.STUDENT and not current_user.is_superuser:
        enrollments = crud_enrollment.get_enrollments_by_student(
            session=session, student_id=current_user.id
        )
        group_ids = [e.group_id for e in enrollments]
        lessons = crud_lesson.get_lessons_by_groups(session=session, group_ids=group_ids)
        return LessonsPublic(data=lessons, count=len(lessons))

    # Teacher/admin — all lessons (by their groups or all)
    from sqlmodel import select
    from app.models import Lesson
    lessons = session.exec(select(Lesson).order_by(Lesson.scheduled_at)).all()  # type: ignore
    return LessonsPublic(data=lessons, count=len(lessons))


@router.post("/recurring", response_model=LessonsPublic)
def create_recurring_lessons(
    *,
    session: SessionDep,
    body: RecurringLessonCreate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """Generate a series of recurring lessons for a group."""
    from datetime import datetime, timezone

    if not (1 <= body.count <= 52):
        raise HTTPException(status_code=422, detail="count must be between 1 and 52")

    series_id = uuid4()
    step_days = 7 if body.frequency == "weekly" else 14

    # Parse first datetime
    base_dt = datetime.fromisoformat(f"{body.first_date}T{body.time}:00")

    created: list[Lesson] = []
    for i in range(body.count):
        dt = base_dt + timedelta(days=i * step_days)
        lesson = Lesson(
            title=body.title,
            description=body.description,
            scheduled_at=dt,
            duration_minutes=body.duration_minutes,
            location=body.location,
            group_id=body.group_id,
            series_id=series_id,
        )
        session.add(lesson)
        created.append(lesson)

    session.commit()
    for lesson in created:
        session.refresh(lesson)

    return LessonsPublic(data=created, count=len(created))


@router.post("/", response_model=LessonPublic)
def create_lesson(
    *,
    session: SessionDep,
    lesson_in: LessonCreate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    return crud_lesson.create_lesson(session=session, lesson_create=lesson_in)


@router.patch("/{lesson_id}", response_model=LessonPublic)
def update_lesson(
    *,
    session: SessionDep,
    lesson_id: UUID,
    lesson_in: LessonUpdate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    lesson = crud_lesson.get_lesson_by_id(session=session, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return crud_lesson.update_lesson(session=session, db_lesson=lesson, lesson_in=lesson_in)


@router.delete("/{lesson_id}")
def delete_lesson(
    *,
    session: SessionDep,
    lesson_id: UUID,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    lesson = crud_lesson.get_lesson_by_id(session=session, lesson_id=lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    crud_lesson.delete_lesson(session=session, db_lesson=lesson)
    return {"ok": True}
