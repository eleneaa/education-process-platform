from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.crud import crud_admission_request
from app.api.deps import SessionDep, CurrentUser
from app.models import (
    AdmissionRequest,
    AdmissionRequestCreate,
    AdmissionRequestPublic,
    AdmissionRequestUpdate,
    AdmissionRequestsPublic,
    User,
)
from sqlmodel import SQLModel


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
def update_admission_request(
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