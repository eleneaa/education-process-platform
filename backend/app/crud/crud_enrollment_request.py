from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select

from app.models.enrollment_request import (
    EnrollmentRequest,
    EnrollmentRequestCreate,
    EnrollmentRequestUpdate,
)


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_enrollment_request(
    *,
    session: Session,
    enrollment_request_create: EnrollmentRequestCreate,
) -> EnrollmentRequest:
    db_obj = EnrollmentRequest.model_validate(enrollment_request_create)

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    return db_obj


def get_enrollment_request_by_id(
    *,
    session: Session,
    enrollment_request_id: UUID,
) -> EnrollmentRequest | None:
    statement = select(EnrollmentRequest).where(
        EnrollmentRequest.id == enrollment_request_id
    )
    return session.exec(statement).first()


def get_enrollment_requests(
    *,
    session: Session,
) -> list[EnrollmentRequest]:
    statement = select(EnrollmentRequest)
    return session.exec(statement).all()


def update_enrollment_request(
    *,
    session: Session,
    db_enrollment_request: EnrollmentRequest,
    enrollment_request_in: EnrollmentRequestUpdate,
) -> EnrollmentRequest:
    update_data = enrollment_request_in.model_dump(exclude_unset=True)

    update_data["updated_at"] = get_datetime_utc()

    db_enrollment_request.sqlmodel_update(update_data)

    session.add(db_enrollment_request)
    session.commit()
    session.refresh(db_enrollment_request)

    return db_enrollment_request


def delete_enrollment_request(
    *,
    session: Session,
    db_enrollment_request: EnrollmentRequest,
) -> None:
    session.delete(db_enrollment_request)
    session.commit()