from uuid import UUID

from sqlmodel import Session, select, func

from app.models import Progress, ProgressCreate, ProgressUpdate
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