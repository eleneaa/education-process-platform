"""
Individual educational trajectory module.

Provides personalised recommendations for a student based on their current
progress within a program.  Logic is intentionally simple (MVP):

- If the student has no progress records → recommend "start" (first module)
- If some modules are IN_PROGRESS → recommend "continue" (those modules)
- If all modules are COMPLETED → recommend "completed"
- Otherwise → recommend "continue" with the first not-started/in-progress module
"""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, select

from app.api.deps import SessionDep, CurrentUser
from app.models import Module, Program
from app.models.enums import ProgressStatus
from app.crud import crud_progress

router = APIRouter(
    prefix="/trajectory",
    tags=["Trajectory"],
)


class ModuleRecommendation(SQLModel):
    module_id: UUID
    title: str
    position: int | None
    action: str  # "start" | "continue" | "revisit"


class TrajectoryResponse(SQLModel):
    student_id: UUID
    program_id: UUID
    status: str  # "not_started" | "in_progress" | "completed"
    percentage: float
    recommendations: list[ModuleRecommendation]


@router.get(
    "/programs/{program_id}/students/{student_id}",
    response_model=TrajectoryResponse,
)
def get_student_trajectory(
    program_id: UUID,
    student_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Return personalised learning trajectory and recommendations for a student.
    Students can only view their own trajectory.
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

    # Fetch all modules ordered by position
    modules: list[Module] = session.exec(
        select(Module)
        .where(Module.program_id == program_id)
        .order_by(Module.position)  # type: ignore
    ).all()

    if not modules:
        return TrajectoryResponse(
            student_id=student_id,
            program_id=program_id,
            status="not_started",
            percentage=0.0,
            recommendations=[],
        )

    # Build a map: module_id → progress status
    progress_records = crud_progress.get_progresses_by_student(
        session=session, student_id=student_id
    )
    progress_map = {p.module_id: p.status for p in progress_records}

    # Compute aggregate stats
    total = len(modules)
    completed = sum(
        1 for m in modules if progress_map.get(m.id) == ProgressStatus.COMPLETED
    )
    percentage = round((completed / total) * 100, 2)

    # Determine overall status
    if completed == total:
        overall_status = "completed"
    elif completed > 0 or any(
        progress_map.get(m.id) == ProgressStatus.IN_PROGRESS for m in modules
    ):
        overall_status = "in_progress"
    else:
        overall_status = "not_started"

    # Build recommendations (max 3 next actionable modules)
    recommendations: list[ModuleRecommendation] = []
    for module in modules:
        if len(recommendations) >= 3:
            break
        status = progress_map.get(module.id)
        if status == ProgressStatus.COMPLETED:
            continue
        if status == ProgressStatus.IN_PROGRESS:
            action = "continue"
        elif status is None or status == ProgressStatus.NOT_STARTED:
            action = "start" if overall_status == "not_started" else "start"
        else:
            action = "revisit"

        recommendations.append(
            ModuleRecommendation(
                module_id=module.id,
                title=module.title,
                position=module.position,
                action=action,
            )
        )

    return TrajectoryResponse(
        student_id=student_id,
        program_id=program_id,
        status=overall_status,
        percentage=percentage,
        recommendations=recommendations,
    )
