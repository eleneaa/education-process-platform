from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select, func

from app.models.admission_request import (
    AdmissionRequest,
    AdmissionRequestCreate,
    AdmissionRequestUpdate,
)


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_admission_request(
    *,
    session: Session,
    admission_request_create: AdmissionRequestCreate,
) -> AdmissionRequest:
    db_obj = AdmissionRequest.model_validate(admission_request_create)

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    return db_obj


def get_admission_request_by_id(
    *,
    session: Session,
    admission_request_id: UUID,
) -> AdmissionRequest | None:
    statement = select(AdmissionRequest).where(
        AdmissionRequest.id == admission_request_id
    )
    return session.exec(statement).first()


def get_admission_requests(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[AdmissionRequest]:
    statement = (
        select(AdmissionRequest)
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def get_admission_requests_count(
    *,
    session: Session,
) -> int:
    statement = select(func.count()).select_from(AdmissionRequest)
    return session.exec(statement).one()


def update_admission_request(
    *,
    session: Session,
    db_admission_request: AdmissionRequest,
    admission_request_in: AdmissionRequestUpdate,
) -> AdmissionRequest:
    update_data = admission_request_in.model_dump(exclude_unset=True)

    update_data["updated_at"] = get_datetime_utc()

    db_admission_request.sqlmodel_update(update_data)

    session.add(db_admission_request)
    session.commit()
    session.refresh(db_admission_request)

    return db_admission_request


def delete_admission_request(
    *,
    session: Session,
    db_admission_request: AdmissionRequest,
) -> None:
    session.delete(db_admission_request)
    session.commit()