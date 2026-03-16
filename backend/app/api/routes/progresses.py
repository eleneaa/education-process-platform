from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.crud import crud_progress
from app.api.deps import SessionDep
from app.models import ProgressCreate, ProgressPublic, ProgressUpdate, ProgressesPublic

router = APIRouter(
    prefix="/progresses",
    tags=["Progresses"],
)


@router.get("/", response_model=ProgressesPublic)
def read_progresses(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve progresses.
    """
    progresses = crud_progress.get_progresses(
        session=session,
        skip=skip,
        limit=limit,
    )
    count = crud_progress.get_progresses_count(session=session)

    return ProgressesPublic(
        data=progresses,
        count=count,
    )


@router.get("/{progress_id}", response_model=ProgressPublic)
def read_progress(
    progress_id: UUID,
    session: SessionDep,
) -> Any:
    """
    Get progress by id.
    """
    progress = crud_progress.get_progress_by_id(
        session=session,
        progress_id=progress_id,
    )

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Progress not found",
        )

    return progress


@router.post("/", response_model=ProgressPublic)
def create_progress(
    *,
    session: SessionDep,
    progress_in: ProgressCreate,
) -> Any:
    """
    Create new progress.
    """
    progress = crud_progress.create_progress(
        session=session,
        progress_create=progress_in,
    )

    return progress


@router.patch("/{progress_id}", response_model=ProgressPublic)
def update_progress(
    *,
    session: SessionDep,
    progress_id: UUID,
    progress_in: ProgressUpdate,
) -> Any:
    """
    Update progress.
    """
    progress = crud_progress.get_progress_by_id(
        session=session,
        progress_id=progress_id,
    )

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Progress not found",
        )

    progress = crud_progress.update_progress(
        session=session,
        db_progress=progress,
        progress_in=progress_in,
    )

    return progress


@router.delete("/{progress_id}")
def delete_progress(
    *,
    session: SessionDep,
    progress_id: UUID,
) -> Any:
    """
    Delete progress.
    """
    progress = crud_progress.get_progress_by_id(
        session=session,
        progress_id=progress_id,
    )

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Progress not found",
        )

    crud_progress.delete_progress(
        session=session,
        db_progress=progress,
    )

    return {"ok": True}