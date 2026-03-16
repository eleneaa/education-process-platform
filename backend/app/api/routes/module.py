from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.crud import crud_module
from app.api.deps import SessionDep

from app.models import ModulesPublic, Module, ModuleCreate, ModuleUpdate, ModulePublic

router = APIRouter(
    prefix="/modules",
    tags=["Modules"],
)


@router.get("/", response_model=ModulesPublic)
def read_modules(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve modules.
    """

    modules = crud_module.get_modules(
        session=session,
        skip=skip,
        limit=limit,
    )

    count = crud_module.get_modules_count(session=session)

    return ModulesPublic(
        data=modules,
        count=count,
    )


@router.get("/{module_id}", response_model=ModulePublic)
def read_module(
    module_id: UUID,
    session: SessionDep,
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