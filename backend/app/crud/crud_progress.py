from uuid import UUID

from sqlmodel import Session, select, func

from app.models import Progress, ProgressCreate, ProgressUpdate, Module
from app.models.enums import ProgressStatus
from app.models.utils import get_datetime_utc


def create_progress(
    *,
    session: Session,
    progress_create: ProgressCreate,
) -> Progress:
    db_obj = Progress.model_validate(progress_create)

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    return db_obj


def get_progress_by_id(
    *,
    session: Session,
    progress_id: UUID,
) -> Progress | None:
    statement = select(Progress).where(Progress.id == progress_id)
    return session.exec(statement).first()


def get_progresses(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Progress]:
    statement = (
        select(Progress)
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def get_progresses_count(
    *,
    session: Session,
) -> int:
    statement = select(func.count()).select_from(Progress)
    return session.exec(statement).one()


def update_progress(
    *,
    session: Session,
    db_progress: Progress,
    progress_in: ProgressUpdate,
) -> Progress:
    update_data = progress_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = get_datetime_utc()

    db_progress.sqlmodel_update(update_data)

    session.add(db_progress)
    session.commit()
    session.refresh(db_progress)

    return db_progress


def delete_progress(
    *,
    session: Session,
    db_progress: Progress,
) -> None:
    session.delete(db_progress)
    session.commit()


def get_progress_by_student_and_module(
    *,
    session: Session,
    student_id: UUID,
    module_id: UUID,
) -> Progress | None:
    statement = select(Progress).where(
        Progress.student_id == student_id,
        Progress.module_id == module_id,
    )
    return session.exec(statement).first()


def get_progresses_by_student(
    *,
    session: Session,
    student_id: UUID,
) -> list[Progress]:
    statement = select(Progress).where(Progress.student_id == student_id)
    return session.exec(statement).all()


def get_program_progress_summary(
    *,
    session: Session,
    student_id: UUID,
    program_id: UUID,
) -> dict:
    """
    Returns {total_modules, completed_modules, percentage} for a student in a program.
    P = (N_completed / N_total) * 100 — computed dynamically, not stored.
    """
    total_stmt = (
        select(func.count())
        .select_from(Module)
        .where(Module.program_id == program_id)
    )
    total: int = session.exec(total_stmt).one()

    if total == 0:
        return {"total_modules": 0, "completed_modules": 0, "percentage": 0.0}

    completed_stmt = (
        select(func.count())
        .select_from(Progress)
        .join(Module, Progress.module_id == Module.id)
        .where(
            Module.program_id == program_id,
            Progress.student_id == student_id,
            Progress.status == ProgressStatus.COMPLETED,
        )
    )
    completed: int = session.exec(completed_stmt).one()

    percentage = round((completed / total) * 100, 2)
    return {
        "total_modules": total,
        "completed_modules": completed,
        "percentage": percentage,
    }