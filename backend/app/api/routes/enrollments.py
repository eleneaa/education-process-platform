from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from app.crud import crud_enrollment
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin
from app.models import EnrollmentCreate, EnrollmentPublic, EnrollmentUpdate, EnrollmentsPublic, User

router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments"],
)


class EnrollmentWithStudent(EnrollmentPublic):
    student_name: str | None = None
    student_email: str | None = None


class EnrollmentsWithStudentsPublic(EnrollmentsPublic):
    data: list[EnrollmentWithStudent]  # type: ignore


def _enrich_enrollment(session, enrollment) -> EnrollmentWithStudent:
    student = session.get(User, enrollment.student_id)
    data = EnrollmentWithStudent.model_validate(enrollment)
    if student:
        data.student_name = student.full_name or student.email
        data.student_email = student.email
    return data


@router.get("/", response_model=EnrollmentsWithStudentsPublic)
def read_enrollments(
    session: SessionDep,
    current_user: CurrentUser,
    group_id: UUID | None = Query(default=None),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve enrollments. Admins/teachers see all; students see only their own.
    """
    from app.models.enums import UserRole
    if current_user.role == UserRole.STUDENT and not current_user.is_superuser:
        enrollments = crud_enrollment.get_enrollments_by_student(
            session=session,
            student_id=current_user.id,
        )
        return EnrollmentsWithStudentsPublic(
            data=[_enrich_enrollment(session, e) for e in enrollments],
            count=len(enrollments),
        )

    if group_id:
        enrollments = crud_enrollment.get_enrollments_by_group(session=session, group_id=group_id)
        return EnrollmentsWithStudentsPublic(
            data=[_enrich_enrollment(session, e) for e in enrollments],
            count=len(enrollments),
        )

    enrollments = crud_enrollment.get_enrollments(session=session, skip=skip, limit=limit)
    count = crud_enrollment.get_enrollments_count(session=session)
    return EnrollmentsWithStudentsPublic(
        data=[_enrich_enrollment(session, e) for e in enrollments],
        count=count,
    )


@router.get("/{enrollment_id}", response_model=EnrollmentPublic)
def read_enrollment(
    enrollment_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get enrollment by id.
    """
    enrollment = crud_enrollment.get_enrollment_by_id(
        session=session,
        enrollment_id=enrollment_id,
    )

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    from app.models.enums import UserRole
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and enrollment.student_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    return enrollment


@router.post("/", response_model=EnrollmentPublic)
def create_enrollment(
    *,
    session: SessionDep,
    enrollment_in: EnrollmentCreate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Enroll a student in a group. Returns 409 if already enrolled.
    """
    existing = crud_enrollment.get_enrollment_by_student_and_group(
        session=session,
        student_id=enrollment_in.student_id,
        group_id=enrollment_in.group_id,
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Student is already enrolled in this group",
        )

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
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Update enrollment status.
    """
    enrollment = crud_enrollment.get_enrollment_by_id(
        session=session,
        enrollment_id=enrollment_id,
    )

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

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
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Delete enrollment.
    """
    enrollment = crud_enrollment.get_enrollment_by_id(
        session=session,
        enrollment_id=enrollment_id,
    )

    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    crud_enrollment.delete_enrollment(session=session, db_enrollment=enrollment)
    return {"ok": True}
