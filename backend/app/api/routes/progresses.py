from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.crud import crud_progress
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin
from app.models import ProgressCreate, ProgressPublic, ProgressUpdate, ProgressesPublic

router = APIRouter(
    prefix="/progresses",
    tags=["Progresses"],
)


@router.get("/", response_model=ProgressesPublic)
def read_progresses(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve progresses. Students see only their own records.
    """
    from app.models.enums import UserRole
    if current_user.role == UserRole.STUDENT and not current_user.is_superuser:
        progresses = crud_progress.get_progresses_by_student(
            session=session,
            student_id=current_user.id,
        )
        return ProgressesPublic(data=progresses, count=len(progresses))

    progresses = crud_progress.get_progresses(session=session, skip=skip, limit=limit)
    count = crud_progress.get_progresses_count(session=session)
    return ProgressesPublic(data=progresses, count=count)


@router.get("/{progress_id}", response_model=ProgressPublic)
def read_progress(
    progress_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get progress by id.
    """
    progress = crud_progress.get_progress_by_id(
        session=session,
        progress_id=progress_id,
    )

    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    from app.models.enums import UserRole
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and progress.student_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    return progress


@router.post("/", response_model=ProgressPublic)
def create_progress(
    *,
    session: SessionDep,
    progress_in: ProgressCreate,
    current_user: CurrentUser,
) -> Any:
    """
    Create or record a new progress entry.
    Teachers/admins can record for any student; students record for themselves only.
    """
    from app.models.enums import UserRole, ProgressStatus
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and progress_in.student_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    progress = crud_progress.create_progress(
        session=session,
        progress_create=progress_in,
    )

    # Award points when a module is completed
    if progress.status == ProgressStatus.COMPLETED:
        from app.crud.crud_gamification import add_points
        add_points(session=session, user_id=progress.student_id, points=10)

    return progress


@router.patch("/{progress_id}", response_model=ProgressPublic)
def update_progress(
    *,
    session: SessionDep,
    progress_id: UUID,
    progress_in: ProgressUpdate,
    current_user: CurrentUser,
) -> Any:
    """
    Update progress record. Completing a module awards 10 points.
    """
    progress = crud_progress.get_progress_by_id(
        session=session,
        progress_id=progress_id,
    )

    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    from app.models.enums import UserRole, ProgressStatus
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and progress.student_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    was_completed = progress.status == ProgressStatus.COMPLETED
    progress = crud_progress.update_progress(
        session=session,
        db_progress=progress,
        progress_in=progress_in,
    )

    # Award points only on transition to COMPLETED
    if not was_completed and progress.status == ProgressStatus.COMPLETED:
        from app.crud.crud_gamification import add_points
        add_points(session=session, user_id=progress.student_id, points=10)

    return progress


@router.delete("/{progress_id}")
def delete_progress(
    *,
    session: SessionDep,
    progress_id: UUID,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Delete progress record (teachers and admins only).
    """
    progress = crud_progress.get_progress_by_id(
        session=session,
        progress_id=progress_id,
    )

    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    crud_progress.delete_progress(session=session, db_progress=progress)
    return {"ok": True}
