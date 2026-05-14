from uuid import UUID
from sqlmodel import Session, select
from app.models import Attendance, AttendanceCreate, AttendanceUpdate, AttendanceStatus, Lesson, Progress, ProgressCreate
from app.models.enums import ProgressStatus, UserRole


def create_attendance(
    *,
    session: Session,
    attendance_create: AttendanceCreate,
) -> Attendance:
    db_obj = Attendance.model_validate(attendance_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    # Award points for attendance
    if db_obj.status == AttendanceStatus.present:
        _award_points_for_attendance(session, db_obj)

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

    # Update progress if lesson has module
    _update_progress_from_attendance(session, db_attendance)

    # Award points for attendance
    if db_attendance.status == AttendanceStatus.present:
        _award_points_for_attendance(session, db_attendance)

    return db_attendance


def delete_attendance(
    *,
    session: Session,
    db_attendance: Attendance,
) -> None:
    session.delete(db_attendance)
    session.commit()


def _update_progress_from_attendance(session: Session, attendance: Attendance) -> None:
    """Update student progress based on attendance status and lesson module."""
    import logging
    logger = logging.getLogger(__name__)

    lesson = session.get(Lesson, attendance.lesson_id)
    if not lesson:
        logger.warning(f"Lesson {attendance.lesson_id} not found")
        return
    if not lesson.module_id:
        logger.warning(f"Lesson {lesson.title} has no module_id")
        return

    logger.info(f"Updating progress for student {attendance.student_id} on lesson {lesson.title} (module {lesson.module_id})")

    # Check if progress exists, if not create it
    progress = session.exec(
        select(Progress).where(
            Progress.student_id == attendance.student_id,
            Progress.module_id == lesson.module_id,
        )
    ).first()

    if not progress:
        progress = Progress(
            student_id=attendance.student_id,
            module_id=lesson.module_id,
            status=ProgressStatus.NOT_STARTED,
        )
        session.add(progress)
        session.flush()

    # Update status based on attendance
    if attendance.status == AttendanceStatus.present:
        if progress.status == ProgressStatus.NOT_STARTED:
            progress.status = ProgressStatus.IN_PROGRESS
            session.add(progress)
        session.commit()

        # Check if all lessons for this module are attended
        _check_module_completion(session, attendance.student_id, lesson.module_id)
    elif attendance.status == AttendanceStatus.absent:
        # If marked absent, keep or reset to NOT_STARTED
        session.commit()


def _check_module_completion(session: Session, student_id: UUID, module_id: UUID) -> None:
    """Check if student attended all lessons in the module and mark as completed."""
    import logging
    logger = logging.getLogger(__name__)

    # Get all lessons for the module
    all_lessons = session.exec(
        select(Lesson).where(Lesson.module_id == module_id)
    ).all()

    if not all_lessons:
        logger.info(f"No lessons found for module {module_id}")
        return

    lesson_ids = [l.id for l in all_lessons]
    logger.info(f"Module {module_id} has {len(all_lessons)} total lessons: {lesson_ids}")

    # Count attended lessons (present status) - refresh session first
    session.expire_all()

    attended = session.exec(
        select(Attendance).where(
            Attendance.student_id == student_id,
            Attendance.lesson_id.in_(lesson_ids),
            Attendance.status == AttendanceStatus.present,
        )
    ).all()

    attended_count = len(attended)
    attended_lesson_ids = [a.lesson_id for a in attended]
    logger.info(f"Student {student_id} attended {attended_count}/{len(all_lessons)} lessons. Attended lesson IDs: {attended_lesson_ids}")

    # If attended all lessons, mark module as completed
    if attended_count >= len(all_lessons):
        # Get the progress record
        progress = session.exec(
            select(Progress).where(
                Progress.student_id == student_id,
                Progress.module_id == module_id,
            )
        ).first()

        if progress:
            logger.info(f"Found progress record, current status: {progress.status}")
            if progress.status != ProgressStatus.COMPLETED:
                progress.status = ProgressStatus.COMPLETED
                session.add(progress)
                session.commit()
                logger.info(f"✅ Module {module_id} marked as COMPLETED for student {student_id}")
            else:
                logger.info(f"Module already completed")
        else:
            logger.warning(f"No progress record found for student {student_id} in module {module_id}")


def _award_points_for_attendance(session: Session, attendance: Attendance) -> None:
    """Award points when a student marks present."""
    from app.crud.crud_gamification import add_points

    add_points(session=session, user_id=attendance.student_id, points=1)


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
        _update_progress_from_attendance(session, existing)
        if existing.status == AttendanceStatus.present:
            _award_points_for_attendance(session, existing)
        return existing

    attendance_create = AttendanceCreate(
        lesson_id=lesson_id,
        student_id=student_id,
        status=status,
    )
    new_attendance = create_attendance(session=session, attendance_create=attendance_create)
    _update_progress_from_attendance(session, new_attendance)
    if new_attendance.status == AttendanceStatus.present:
        _award_points_for_attendance(session, new_attendance)
    return new_attendance
