from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.crud import crud_module
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin

from app.models import ModulesPublic, Module, ModuleCreate, ModuleUpdate, ModulePublic

router = APIRouter(
    prefix="/modules",
    tags=["Modules"],
)


@router.get("/", response_model=ModulesPublic)
def read_modules(
    session: SessionDep,
    current_user: CurrentUser,
    program_id: UUID | None = Query(default=None),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve modules.
    """

    modules = crud_module.get_modules(
        session=session,
        program_id=program_id,
        skip=skip,
        limit=limit,
    )

    count = crud_module.get_modules_count(session=session, program_id=program_id)

    return ModulesPublic(
        data=modules,
        count=count,
    )


@router.get("/{module_id}", response_model=ModulePublic)
def read_module(
    module_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get module by id.
    """

    module = crud_module.get_module_by_id(
        session=session,
        module_id=module_id,
    )

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    return module


@router.post("/", response_model=ModulePublic)
def create_module(
    *,
    session: SessionDep,
    module_in: ModuleCreate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Create new module.
    """

    module = crud_module.create_module(
        session=session,
        module_create=module_in,
    )

    return module


@router.patch("/{module_id}", response_model=ModulePublic)
def update_module(
    *,
    session: SessionDep,
    module_id: UUID,
    module_in: ModuleUpdate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Update module.
    """

    module = crud_module.get_module_by_id(
        session=session,
        module_id=module_id,
    )

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    module = crud_module.update_module(
        session=session,
        db_module=module,
        module_in=module_in,
    )

    return module


@router.delete("/{module_id}")
def delete_module(
    *,
    session: SessionDep,
    module_id: UUID,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Delete module.
    """

    module = crud_module.get_module_by_id(
        session=session,
        module_id=module_id,
    )

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found",
        )

    crud_module.delete_module(
        session=session,
        db_module=module,
    )

    return {"ok": True}