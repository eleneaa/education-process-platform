from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.crud import crud_program
from app.api.deps import SessionDep, CurrentUser, CurrentTeacherOrAdmin

from app.models import ProgramsPublic, Program, ProgramCreate, ProgramUpdate

router = APIRouter(
    prefix="/programs",
    tags=["Programs"],
)


@router.get("/", response_model=ProgramsPublic)
def read_programs(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve programs.
    """

    programs = crud_program.get_programs(
        session=session,
        skip=skip,
        limit=limit,
    )

    count = crud_program.get_programs_count(session=session)

    return ProgramsPublic(
        data=programs,
        count=count,
    )


@router.get("/{program_id}", response_model=Program)
def read_program(
    program_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get program by id.
    """

    program = crud_program.get_program_by_id(
        session=session,
        program_id=program_id,
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found",
        )

    return program


@router.post("/", response_model=Program)
def create_program(
    *,
    session: SessionDep,
    program_in: ProgramCreate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Create new program.
    """

    program = crud_program.create_program(
        session=session,
        program_create=program_in,
        created_by_id=current_user.id,
    )

    return program


@router.patch("/{program_id}", response_model=Program)
def update_program(
    *,
    session: SessionDep,
    program_id: UUID,
    program_in: ProgramUpdate,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Update program.
    """

    program = crud_program.get_program_by_id(
        session=session,
        program_id=program_id,
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found",
        )

    program = crud_program.update_program(
        session=session,
        db_program=program,
        program_in=program_in,
    )

    return program


@router.delete("/{program_id}")
def delete_program(
    *,
    session: SessionDep,
    program_id: UUID,
    current_user: CurrentTeacherOrAdmin,
) -> Any:
    """
    Delete program.
    """

    program = crud_program.get_program_by_id(
        session=session,
        program_id=program_id,
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Program not found",
        )

    crud_program.delete_program(
        session=session,
        db_program=program,
    )

    return {"ok": True}