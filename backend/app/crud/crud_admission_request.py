from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select, func

from app.models.admission_request import (
    AdmissionRequest,
    AdmissionRequestCreate,
    AdmissionRequestUpdate,
)
from app.models import User, UserCreate, Enrollment, EnrollmentCreate
from app.models.enums import UserRole, EnrollmentStatus
from app.crud.crud_user import create_user


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


def approve_admission_request(
    *,
    session: Session,
    db_admission_request: AdmissionRequest,
    group_id: UUID,
) -> tuple[AdmissionRequest, User, Enrollment]:
    """
    Approve an admission request by:
    1. Creating a user account if not exists
    2. Enrolling the user in the selected group
    3. Updating the admission request status to 'approved'
    """

    existing_user = session.exec(
        select(User).where(User.email == db_admission_request.email)
    ).first()

    if existing_user:
        user = existing_user
    else:
        user_data = UserCreate(
            email=db_admission_request.email,
            full_name=db_admission_request.full_name,
            password="temporary_password_change_me",
            role=UserRole.STUDENT,
            is_active=True,
        )
        user = create_user(session=session, user_create=user_data)

    enrollment = session.exec(
        select(Enrollment).where(
            (Enrollment.student_id == user.id) & (Enrollment.group_id == group_id)
        )
    ).first()

    if not enrollment:
        enrollment_data = EnrollmentCreate(
            student_id=user.id,
            group_id=group_id,
            status=EnrollmentStatus.ACTIVE,
        )
        enrollment = Enrollment.model_validate(enrollment_data)
        session.add(enrollment)

    db_admission_request.status = "approved"
    db_admission_request.updated_at = get_datetime_utc()
    session.add(db_admission_request)
    session.commit()
    session.refresh(db_admission_request)
    session.refresh(user)
    session.refresh(enrollment)

    return db_admission_request, user, enrollment