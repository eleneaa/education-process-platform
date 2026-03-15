from datetime import datetime, timezone
from uuid import UUID

from sqlmodel import Session, select, func

from app.models import Program, ProgramCreate, ProgramUpdate
from app.models.utils import get_datetime_utc
from app.api.deps import CurrentUser


def create_program(
    *,
    session: Session,
    program_create: ProgramCreate,
    created_by_id: UUID,
) -> Program:
    db_obj = Program.model_validate(
        program_create,
        update={"created_by_id": created_by_id},
    )

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    return db_obj


def get_program_by_id(
    *,
    session: Session,
    program_id: UUID,
) -> Program | None:
    statement = select(Program).where(
        Program.id == program_id
    )
    return session.exec(statement).first()


def get_programs(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Program]:
    statement = (
        select(Program)
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def get_programs_count(
    *,
    session: Session,
) -> int:
    statement = select(func.count()).select_from(Program)
    return session.exec(statement).one()


def update_program(
    *,
    session: Session,
    db_program: Program,
    program_in: ProgramUpdate,
) -> Program:
    update_data = program_in.model_dump(exclude_unset=True)

    update_data["updated_at"] = get_datetime_utc()

    db_program.sqlmodel_update(update_data)

    session.add(db_program)
    session.commit()
    session.refresh(db_program)

    return db_program

def delete_program(
    *,
    session: Session,
    db_program: Program,
) -> None:
    session.delete(db_program)
    session.commit()