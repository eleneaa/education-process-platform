from uuid import UUID
from sqlmodel import Session, select, func
from app.models import Lesson, LessonCreate, LessonUpdate


def create_lesson(*, session: Session, lesson_create: LessonCreate) -> Lesson:
    obj = Lesson.model_validate(lesson_create)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def get_lesson_by_id(*, session: Session, lesson_id: UUID) -> Lesson | None:
    return session.exec(select(Lesson).where(Lesson.id == lesson_id)).first()


def get_lessons_by_group(*, session: Session, group_id: UUID) -> list[Lesson]:
    return session.exec(
        select(Lesson).where(Lesson.group_id == group_id).order_by(Lesson.scheduled_at)  # type: ignore
    ).all()


def get_lessons_by_groups(*, session: Session, group_ids: list[UUID]) -> list[Lesson]:
    if not group_ids:
        return []
    return session.exec(
        select(Lesson).where(Lesson.group_id.in_(group_ids)).order_by(Lesson.scheduled_at)  # type: ignore
    ).all()


def update_lesson(*, session: Session, db_lesson: Lesson, lesson_in: LessonUpdate) -> Lesson:
    update_data = lesson_in.model_dump(exclude_unset=True)
    db_lesson.sqlmodel_update(update_data)
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson


def delete_lesson(*, session: Session, db_lesson: Lesson) -> None:
    session.delete(db_lesson)
    session.commit()
