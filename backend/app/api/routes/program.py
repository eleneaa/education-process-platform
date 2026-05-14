from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.crud import crud_program
from app.api.deps import SessionDep, CurrentUser, CurrentAdmin, OptionalCurrentUser, CurrentTeacherOrAdmin
from app.models.enums import ProgramStatus, UserRole

from app.models import ProgramsPublic, Program, ProgramCreate, ProgramUpdate


class AddTeacherRequest(BaseModel):
    teacher_id: UUID

router = APIRouter(
    prefix="/programs",
    tags=["Programs"],
)


@router.get("/", response_model=ProgramsPublic)
def read_programs(
    session: SessionDep,
    current_user: OptionalCurrentUser = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve programs.
    - Unauthenticated users: only approved programs
    - Teachers: only programs they teach
    - Admins: all programs
    """

    if current_user and current_user.role == UserRole.TEACHER:
        programs = crud_program.get_programs_by_teacher(
            session=session,
            teacher_id=current_user.id,
            skip=skip,
            limit=limit,
        )
    else:
        programs = crud_program.get_programs(
            session=session,
            skip=skip,
            limit=limit,
        )

    # Filter to approved programs for unauthenticated users
    if not current_user:
        programs = [p for p in programs if p.status == ProgramStatus.APPROVED]

    count = len(programs) if not current_user else crud_program.get_programs_count(session=session)

    return ProgramsPublic(
        data=programs,
        count=count,
    )


@router.get("/{program_id}", response_model=Program)
def read_program(
    program_id: UUID,
    session: SessionDep,
    current_user: OptionalCurrentUser = None,
) -> Any:
    """
    Get program by id. For unauthenticated users, only approved programs are accessible.
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

    # Restrict access for unauthenticated users
    if not current_user and program.status != ProgramStatus.APPROVED:
        raise HTTPException(
            status_code=403,
            detail="This program is not available for public access",
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
    Create new program (admin or teacher).
    Teachers' programs always start in DRAFT status.
    """

    # Force DRAFT status for teachers
    if current_user.role == UserRole.TEACHER:
        program_in.status = ProgramStatus.DRAFT

    program = crud_program.create_program(
        session=session,
        program_create=program_in,
        created_by_id=current_user.id,
    )

    # Add teacher as the program's first teacher
    crud_program.add_teacher_to_program(
        session=session,
        program_id=program.id,
        teacher_id=current_user.id,
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
    Update program (admin or teacher).
    Teachers can only edit their own programs and cannot set status to APPROVED/REJECTED.
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

    # Check if teacher owns this program
    if current_user.role == UserRole.TEACHER:
        is_teacher = any(t.id == current_user.id for t in program.teachers)
        if not is_teacher:
            raise HTTPException(
                status_code=403,
                detail="You can only edit your own programs",
            )

        # Teachers cannot set status to APPROVED or REJECTED
        if program_in.status in (ProgramStatus.APPROVED, ProgramStatus.REJECTED):
            raise HTTPException(
                status_code=403,
                detail="Only admins can approve or reject programs",
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
    current_user: CurrentAdmin,
) -> Any:
    """
    Delete program (admin only).
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


@router.post("/{program_id}/teachers", response_model=Program)
def add_teacher_to_program(
    *,
    session: SessionDep,
    program_id: UUID,
    request: AddTeacherRequest,
    current_user: CurrentAdmin,
) -> Any:
    """
    Add a teacher to a program (admin only).
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

    crud_program.add_teacher_to_program(
        session=session,
        program_id=program_id,
        teacher_id=request.teacher_id,
    )

    # Refresh to get updated teachers list
    session.refresh(program)

    return program


@router.delete("/{program_id}/teachers/{teacher_id}", response_model=Program)
def remove_teacher_from_program(
    *,
    session: SessionDep,
    program_id: UUID,
    teacher_id: UUID,
    current_user: CurrentAdmin,
) -> Any:
    """
    Remove a teacher from a program (admin only).
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

    crud_program.remove_teacher_from_program(
        session=session,
        program_id=program_id,
        teacher_id=teacher_id,
    )

    # Refresh to get updated teachers list
    session.refresh(program)

    return program