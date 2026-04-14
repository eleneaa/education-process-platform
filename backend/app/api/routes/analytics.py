from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel

from app.crud import crud_progress, crud_enrollment
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin
from app.models import Program, Group

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


class ProgramProgressSummary(SQLModel):
    student_id: UUID
    program_id: UUID
    total_modules: int
    completed_modules: int
    percentage: float


class GroupProgressReport(SQLModel):
    group_id: UUID
    program_id: UUID
    students: list[ProgramProgressSummary]


@router.get(
    "/programs/{program_id}/students/{student_id}/progress",
    response_model=ProgramProgressSummary,
)
def get_student_program_progress(
    program_id: UUID,
    student_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Returns progress summary for a student within a program.
    P = (N_completed / N_total) × 100 — computed dynamically.
    Students can only view their own progress.
    """
    from app.models.enums import UserRole
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and student_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    program = session.get(Program, program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    summary = crud_progress.get_program_progress_summary(
        session=session,
        student_id=student_id,
        program_id=program_id,
    )

    return ProgramProgressSummary(
        student_id=student_id,
        program_id=program_id,
        **summary,
    )


@router.get(
    "/groups/{group_id}/progress",
    response_model=GroupProgressReport,
)
def get_group_progress_report(
    group_id: UUID,
    session: SessionDep,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Returns progress summaries for all enrolled students in a group.
    Teachers and admins only.
    """
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    enrollments = crud_enrollment.get_enrollments_by_group(
        session=session, group_id=group_id
    )

    student_summaries: list[ProgramProgressSummary] = []
    for enrollment in enrollments:
        summary = crud_progress.get_program_progress_summary(
            session=session,
            student_id=enrollment.student_id,
            program_id=group.program_id,
        )
        student_summaries.append(
            ProgramProgressSummary(
                student_id=enrollment.student_id,
                program_id=group.program_id,
                **summary,
            )
        )

    return GroupProgressReport(
        group_id=group_id,
        program_id=group.program_id,
        students=student_summaries,
    )
