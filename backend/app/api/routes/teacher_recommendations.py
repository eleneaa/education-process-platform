from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from app.crud import crud_teacher_recommendation
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin
from app.models import TeacherRecommendation, TeacherRecommendationCreate, TeacherRecommendationUpdate, TeacherRecommendationPublic, Program, User
from app.models.enums import UserRole

router = APIRouter(
    prefix="/teacher-recommendations",
    tags=["Teacher Recommendations"],
)


class TeacherRecommendationWithDetails(TeacherRecommendationPublic):
    program_title: str | None = None
    program_description: str | None = None
    teacher_name: str | None = None


def _enrich_recommendation(session, recommendation) -> TeacherRecommendationWithDetails:
    """Add program and teacher details to a recommendation."""
    data = TeacherRecommendationWithDetails.model_validate(recommendation)

    # Get program info
    program = session.get(Program, recommendation.program_id)
    if program:
        data.program_title = program.title
        data.program_description = program.description

    # Get teacher info
    teacher = session.get(User, recommendation.teacher_id)
    if teacher:
        data.teacher_name = teacher.full_name or teacher.email

    return data


@router.get("/student/{student_id}")
def get_student_recommendations(
    student_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> list[TeacherRecommendationWithDetails]:
    """
    Get all teacher recommendations for a student.
    Student can view their own, teacher/admin can view any.
    """
    from app.models.enums import UserRole

    # Check permissions
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and current_user.id != student_id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    recommendations = crud_teacher_recommendation.get_recommendations_by_student(
        session=session,
        student_id=student_id,
    )

    return [_enrich_recommendation(session, r) for r in recommendations]


@router.post("/")
def create_recommendation(
    *,
    session: SessionDep,
    recommendation_in: TeacherRecommendationCreate,
    current_user: CurrentTeacherOrAdmin,
) -> TeacherRecommendationWithDetails:
    """
    Create a new teacher recommendation for a student.
    Only teachers and admins can create recommendations.
    """
    # Verify the recommended program exists
    program = session.get(Program, recommendation_in.program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Create a full recommendation object with teacher_id set to current user
    from app.models import TeacherRecommendationBase

    recommendation_data = TeacherRecommendationBase(
        student_id=recommendation_in.student_id,
        teacher_id=current_user.id,
        program_id=recommendation_in.program_id,
        comment=recommendation_in.comment,
    )

    recommendation = crud_teacher_recommendation.create_recommendation(
        session=session,
        recommendation_create=recommendation_data,
    )

    return _enrich_recommendation(session, recommendation)


@router.delete("/{recommendation_id}")
def delete_recommendation(
    *,
    session: SessionDep,
    recommendation_id: UUID,
    current_user: CurrentTeacherOrAdmin,
) -> dict[str, str]:
    """
    Delete a teacher recommendation.
    Only the teacher who created it or an admin can delete it.
    """
    recommendation = crud_teacher_recommendation.get_recommendation_by_id(
        session=session,
        recommendation_id=recommendation_id,
    )

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    # Check permissions
    if (
        recommendation.teacher_id != current_user.id
        and not current_user.is_superuser
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    crud_teacher_recommendation.delete_recommendation(
        session=session,
        db_recommendation=recommendation,
    )

    return {"ok": True}
