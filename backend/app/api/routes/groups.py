from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.crud import crud_group
from app.api.deps import SessionDep
from app.models import GroupCreate, GroupPublic, GroupUpdate, GroupsPublic

router = APIRouter(
    prefix="/groups",
    tags=["Groups"],
)


@router.get("/", response_model=GroupsPublic)
def read_groups(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve groups.
    """
    groups = crud_group.get_groups(
        session=session,
        skip=skip,
        limit=limit,
    )
    count = crud_group.get_groups_count(session=session)

    return GroupsPublic(
        data=groups,
        count=count,
    )


@router.get("/{group_id}", response_model=GroupPublic)
def read_group(
    group_id: UUID,
    session: SessionDep,
) -> Any:
    """
    Get group by id.
    """
    group = crud_group.get_group_by_id(
        session=session,
        group_id=group_id,
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    return group


@router.post("/", response_model=GroupPublic)
def create_group(
    *,
    session: SessionDep,
    group_in: GroupCreate,
) -> Any:
    """
    Create new group.
    """
    group = crud_group.create_group(
        session=session,
        group_create=group_in,
    )

    return group


@router.patch("/{group_id}", response_model=GroupPublic)
def update_group(
    *,
    session: SessionDep,
    group_id: UUID,
    group_in: GroupUpdate,
) -> Any:
    """
    Update group.
    """
    group = crud_group.get_group_by_id(
        session=session,
        group_id=group_id,
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    group = crud_group.update_group(
        session=session,
        db_group=group,
        group_in=group_in,
    )

    return group


@router.delete("/{group_id}")
def delete_group(
    *,
    session: SessionDep,
    group_id: UUID,
) -> Any:
    """
    Delete group.
    """
    group = crud_group.get_group_by_id(
        session=session,
        group_id=group_id,
    )

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    crud_group.delete_group(
        session=session,
        db_group=group,
    )

    return {"ok": True}