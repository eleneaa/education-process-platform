from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlmodel import select, func

from app.crud import crud_group
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin
from app.models import GroupCreate, GroupPublic, GroupUpdate, GroupsPublic, Enrollment, User

router = APIRouter(
    prefix="/groups",
    tags=["Groups"],
)


def _enrich_group(session, group) -> GroupPublic:
    """Add teacher_name and student_count to a GroupPublic response."""
    teacher_name = None
    if group.teacher_id:
        teacher = session.get(User, group.teacher_id)
        if teacher:
            teacher_name = teacher.full_name or teacher.email

    student_count = session.exec(
        select(func.count()).select_from(Enrollment).where(Enrollment.group_id == group.id)
    ).one()

    data = GroupPublic.model_validate(group)
    data.teacher_name = teacher_name
    data.student_count = student_count
    return data


@router.get("/", response_model=GroupsPublic)
def read_groups(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve groups.
    """
    groups = crud_group.get_groups(session=session, skip=skip, limit=limit)
    count = crud_group.get_groups_count(session=session)
    return GroupsPublic(
        data=[_enrich_group(session, g) for g in groups],
        count=count,
    )


@router.get("/{group_id}", response_model=GroupPublic)
def read_group(
    group_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get group by id.
    """
    group = crud_group.get_group_by_id(session=session, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return _enrich_group(session, group)


@router.post("/", response_model=GroupPublic)
def create_group(
    *,
    session: SessionDep,
    group_in: GroupCreate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Create new group (teacher or admin only).
    """
    group = crud_group.create_group(session=session, group_create=group_in)
    return _enrich_group(session, group)


@router.patch("/{group_id}", response_model=GroupPublic)
def update_group(
    *,
    session: SessionDep,
    group_id: UUID,
    group_in: GroupUpdate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Update group (teacher or admin only).
    """
    group = crud_group.get_group_by_id(session=session, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    group = crud_group.update_group(session=session, db_group=group, group_in=group_in)
    return _enrich_group(session, group)


@router.delete("/{group_id}")
def delete_group(
    *,
    session: SessionDep,
    group_id: UUID,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Delete group (teacher or admin only).
    """
    group = crud_group.get_group_by_id(session=session, group_id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    crud_group.delete_group(session=session, db_group=group)
    return {"ok": True}