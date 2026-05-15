import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request
from sqlmodel import select

from app.crud import crud_admission_request
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin
from app.core.config import settings
from app.core.rate_limiter import rate_limiter
from app.models import (
    AdmissionRequest,
    AdmissionRequestCreate,
    AdmissionRequestPublic,
    AdmissionRequestUpdate,
    AdmissionRequestsPublic,
    User,
)
from sqlmodel import SQLModel

logger = logging.getLogger(__name__)


class AdmissionRequestEnriched(AdmissionRequestPublic):
    assigned_to_name: str | None = None


class AdmissionRequestsEnrichedPublic(AdmissionRequestsPublic):
    data: list[AdmissionRequestEnriched]  # type: ignore


def _enrich(session, req) -> AdmissionRequestEnriched:
    data = AdmissionRequestEnriched.model_validate(req)
    if req.assigned_to_id:
        user = session.get(User, req.assigned_to_id)
        if user:
            data.assigned_to_name = user.full_name or user.email
    return data

router = APIRouter(
    prefix="/admission-requests",
    tags=["Admission Requests"],
)


@router.get("/", response_model=AdmissionRequestsEnrichedPublic)
def read_admission_requests(
    session: SessionDep,
    current_user: CurrentUser,
    status: str | None = Query(default=None),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve admission requests.
    """

    admission_requests = crud_admission_request.get_admission_requests(
        session=session,
        skip=skip,
        limit=limit,
    )

    if status:
        admission_requests = [r for r in admission_requests if r.status == status]

    count = len(admission_requests)

    return AdmissionRequestsEnrichedPublic(
        data=[_enrich(session, r) for r in admission_requests],
        count=count,
    )


@router.get("/{admission_request_id}", response_model=AdmissionRequest)
def read_admission_request(
    admission_request_id: UUID,
    session: SessionDep,
) -> Any:
    """
    Get admission request by id.
    """

    admission_request = crud_admission_request.get_admission_request_by_id(
        session=session,
        admission_request_id=admission_request_id,
    )

    if not admission_request:
        raise HTTPException(
            status_code=404,
            detail="Admission request not found",
        )

    return admission_request


@router.post("/", response_model=AdmissionRequest)
def create_admission_request(
    *,
    session: SessionDep,
    admission_request_in: AdmissionRequestCreate,
) -> Any:
    """
    Create new admission request.
    """

    admission_request = crud_admission_request.create_admission_request(
        session=session,
        admission_request_create=admission_request_in,
    )

    return admission_request


@router.patch("/{admission_request_id}", response_model=AdmissionRequestEnriched)
async def update_admission_request(
    *,
    session: SessionDep,
    admission_request_id: UUID,
    admission_request_in: AdmissionRequestUpdate,
) -> Any:
    """
    Update admission request.
    """

    admission_request = crud_admission_request.get_admission_request_by_id(
        session=session,
        admission_request_id=admission_request_id,
    )

    if not admission_request:
        raise HTTPException(
            status_code=404,
            detail="Admission request not found",
        )

    admission_request = crud_admission_request.update_admission_request(
        session=session,
        db_admission_request=admission_request,
        admission_request_in=admission_request_in,
    )

    # Notify student via Telegram if status changed
    if (
        admission_request_in.status is not None
        and settings.telegram_enabled
        and admission_request.email
    ):
        user = session.exec(
            select(User).where(User.email == admission_request.email)
        ).first()
        if user and user.telegram_chat_id:
            try:
                from app.integrations.telegram.notifications import (
                    notify_student_status_change,
                )

                await notify_student_status_change(
                    telegram_chat_id=user.telegram_chat_id,
                    admission=admission_request,
                )
            except Exception as exc:
                logger.warning(
                    "Failed to send Telegram notification: %s", exc, exc_info=True
                )

    return _enrich(session, admission_request)


@router.delete("/{admission_request_id}")
def delete_admission_request(
    *,
    session: SessionDep,
    admission_request_id: UUID,
) -> Any:
    """
    Delete admission request.
    """

    admission_request = crud_admission_request.get_admission_request_by_id(
        session=session,
        admission_request_id=admission_request_id,
    )

    if not admission_request:
        raise HTTPException(
            status_code=404,
            detail="Admission request not found",
        )

    crud_admission_request.delete_admission_request(
        session=session,
        db_admission_request=admission_request,
    )

    return {"ok": True}


@router.post("/{admission_request_id}/approve", response_model=AdmissionRequestEnriched)
async def approve_admission_request(
    *,
    session: SessionDep,
    admission_request_id: UUID,
    group_id: UUID,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Approve an admission request by:
    1. Creating a user account if not exists
    2. Enrolling the user in the selected group
    3. Updating the admission request status to 'approved'

    Only admin/teacher can approve.
    """
    from app.models.enums import UserRole

    if current_user.role == UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Students cannot approve admission requests",
        )

    admission_request = crud_admission_request.get_admission_request_by_id(
        session=session,
        admission_request_id=admission_request_id,
    )

    if not admission_request:
        raise HTTPException(
            status_code=404,
            detail="Admission request not found",
        )

    if admission_request.status == "approved":
        raise HTTPException(
            status_code=400,
            detail="Admission request is already approved",
        )

    admission_request, user, enrollment = crud_admission_request.approve_admission_request(
        session=session,
        db_admission_request=admission_request,
        group_id=group_id,
    )

    return _enrich(session, admission_request)


class UserCreatedResponse(SQLModel):
    id: UUID
    email: str | None
    full_name: str | None
    password: str


@router.post("/{admission_request_id}/create-user", response_model=UserCreatedResponse)
def create_user_from_admission(
    admission_request_id: UUID,
    *,
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Create a user account from an admission request (without enrolling in group).
    Updates admission request status to 'approved'.

    Returns user info including temporary password for sending to student.
    Only admin/teacher can create.
    """
    from app.models.enums import UserRole
    from app.crud.crud_user import create_user
    from app.models import UserCreate

    if current_user.role == UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Students cannot create users from admission requests",
        )

    admission_request = crud_admission_request.get_admission_request_by_id(
        session=session,
        admission_request_id=admission_request_id,
    )

    if not admission_request:
        raise HTTPException(
            status_code=404,
            detail="Admission request not found",
        )

    # Check if user already exists
    existing_user = session.exec(
        select(User).where(User.email == admission_request.email)
    ).first()

    if existing_user:
        # User exists, update status to user_created
        admission_request.status = "user_created"
        session.add(admission_request)
        session.commit()
        session.refresh(admission_request)
        return UserCreatedResponse(
            id=existing_user.id,
            email=existing_user.email,
            full_name=existing_user.full_name,
            password="(user already exists)",
        )

    # Create new user with temporary password
    import random
    import string
    temp_pass_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    temporary_password = f"TempPass_{temp_pass_suffix}"
    user_create = UserCreate(
        email=admission_request.email,
        full_name=admission_request.full_name,
        password=temporary_password,
        role=UserRole.STUDENT,
        is_active=True,
    )
    user = create_user(session=session, user_create=user_create)

    # Update status to user_created
    admission_request.status = "user_created"
    session.add(admission_request)
    session.commit()
    session.refresh(admission_request)

    return UserCreatedResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        password=temporary_password,
    )


@router.post("/public/create", response_model=AdmissionRequest)
@rate_limiter.limit(max_requests=5, window_seconds=3600)
def create_admission_request_public(
    request: Request,
    *,
    session: SessionDep,
    admission_request_in: AdmissionRequestCreate,
) -> Any:
    """
    Create admission request from public form (rate-limited: 5 per hour).
    No authentication required. Source is automatically set to 'website'.
    """

    # Ensure source is set to website for public requests
    admission_request_data = admission_request_in.model_dump()
    admission_request_data["source"] = "website"
    admission_request_create = AdmissionRequestCreate(**admission_request_data)

    admission_request = crud_admission_request.create_admission_request(
        session=session,
        admission_request_create=admission_request_create,
    )

    return admission_request