from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.crud import crud_admission_request
from app.api.deps import SessionDep
from app.models import (
    AdmissionRequest,
    AdmissionRequestCreate,
    AdmissionRequestUpdate,
    AdmissionRequestsPublic,
)

router = APIRouter(
    prefix="/admission-requests",
    tags=["Admission Requests"],
)


@router.get("/", response_model=AdmissionRequestsPublic)
def read_admission_requests(
    session: SessionDep,
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

    count = crud_admission_request.get_admission_requests_count(session=session)

    return AdmissionRequestsPublic(
        data=admission_requests,
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


@router.patch("/{admission_request_id}", response_model=AdmissionRequest)
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

    return admission_request


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