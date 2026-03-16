from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.crud import crud_enrollment
from app.api.deps import SessionDep
from app.models import EnrollmentCreate, EnrollmentPublic, EnrollmentUpdate, EnrollmentsPublic

router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments"],
)


@router.get("/", response_model=EnrollmentsPublic)
def read_enrollments(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve enrollments.
    """
    enrollments = crud_enrollment.get_enrollments(
        session=session,
        skip=skip,
        limit=limit,
    )
    count = crud_enrollment.get_enrollments_count(session=session)

    return EnrollmentsPublic(
        data=enrollments,
        count=count,
    )


@router.get("/{enrollment_id}", response_model=EnrollmentPublic)
def read_enrollment(
    enrollment_id: UUID,
    session: SessionDep,
) -> Any:
    """
    Get enrollment by id.
    """
    enrollment = crud_enrollment.get_enrollment_by_id(
        session=session,
        enrollment_id=enrollment_id,
    )

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found",
        )

    return enrollment


@router.post("/", response_model=EnrollmentPublic)
def create_enrollment(
    *,
    session: SessionDep,
    enrollment_in: EnrollmentCreate,
) -> Any:
    """
    Create new enrollment.
    """
    enrollment = crud_enrollment.create_enrollment(
        session=session,
        enrollment_create=enrollment_in,
    )

    return enrollment


@router.patch("/{enrollment_id}", response_model=EnrollmentPublic)
def update_enrollment(
    *,
    session: SessionDep,
    enrollment_id: UUID,
    enrollment_in: EnrollmentUpdate,
) -> Any:
    """
    Update enrollment.
    """
    enrollment = crud_enrollment.get_enrollment_by_id(
        session=session,
        enrollment_id=enrollment_id,
    )

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found",
        )

    enrollment = crud_enrollment.update_enrollment(
        session=session,
        db_enrollment=enrollment,
        enrollment_in=enrollment_in,
    )

    return enrollment


@router.delete("/{enrollment_id}")
def delete_enrollment(
    *,
    session: SessionDep,
    enrollment_id: UUID,
) -> Any:
    """
    Delete enrollment.
    """
    enrollment = crud_enrollment.get_enrollment_by_id(
        session=session,
        enrollment_id=enrollment_id,
    )

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found",
        )

    crud_enrollment.delete_enrollment(
        session=session,
        db_enrollment=enrollment,
    )

    return {"ok": True}