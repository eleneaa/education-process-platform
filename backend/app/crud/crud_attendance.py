from uuid import UUID
from sqlmodel import Session, select
from app.models import Attendance, AttendanceCreate, AttendanceUpdate, AttendanceStatus, Lesson


def create_attendance(
    *,
    session: Session,
    attendance_create: AttendanceCreate,
) -> Attendance:
    db_obj = Attendance.model_validate(attendance_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_attendance_by_id(
    *,
    session: Session,
    attendance_id: UUID,
) -> Attendance | None:
    return session.exec(select(Attendance).where(Attendance.id == attendance_id)).first()


def get_attendance_by_lesson_and_student(
    *,
    session: Session,
    lesson_id: UUID,
    student_id: UUID,
) -> Attendance | None:
    return session.exec(
        select(Attendance).where(
            Attendance.lesson_id == lesson_id,
            Attendance.student_id == student_id,
        )
    ).first()


def get_attendance_by_lesson(
    *,
    session: Session,
    lesson_id: UUID,
) -> list[Attendance]:
    return session.exec(
        select(Attendance).where(Attendance.lesson_id == lesson_id)
    ).all()


def get_attendance_by_group(
    *,
    session: Session,
    group_id: UUID,
) -> list[Attendance]:
    return session.exec(
        select(Attendance)
        .join(Lesson, Attendance.lesson_id == Lesson.id)
        .where(Lesson.group_id == group_id)
    ).all()


def update_attendance(
    *,
    session: Session,
    db_attendance: Attendance,
    attendance_in: AttendanceUpdate,
) -> Attendance:
    update_data = attendance_in.model_dump(exclude_unset=True)
    db_attendance.sqlmodel_update(update_data)
    session.add(db_attendance)
    session.commit()
    session.refresh(db_attendance)
    return db_attendance


def delete_attendance(
    *,
    session: Session,
    db_attendance: Attendance,
) -> None:
    session.delete(db_attendance)
    session.commit()


def create_or_update_attendance(
    *,
    session: Session,
    lesson_id: UUID,
    student_id: UUID,
    status: AttendanceStatus,
) -> Attendance:
    existing = get_attendance_by_lesson_and_student(
        session=session,
        lesson_id=lesson_id,
        student_id=student_id,
    )

    if existing:
        existing.status = status
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    attendance_create = AttendanceCreate(
        lesson_id=lesson_id,
        student_id=student_id,
        status=status,
    )
    return create_attendance(session=session, attendance_create=attendance_create)
