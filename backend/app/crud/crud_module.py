from uuid import UUID

from sqlmodel import Session, select, func

from app.models import Module, ModuleCreate, ModuleUpdate
from app.models.utils import get_datetime_utc


def create_module(
    *,
    session: Session,
    module_create: ModuleCreate,
) -> Module:
    db_obj = Module.model_validate(
        module_create,
    )

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    return db_obj


def get_module_by_id(
    *,
    session: Session,
    module_id: UUID,
) -> Module | None:
    statement = select(Module).where(
        Module.id == module_id
    )
    return session.exec(statement).first()


def get_modules(
    *,
    session: Session,
    program_id: UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Module]:
    statement = select(Module)
    if program_id:
        statement = statement.where(Module.program_id == program_id)
    statement = statement.offset(skip).limit(limit)
    return session.exec(statement).all()


def get_modules_count(
    *,
    session: Session,
    program_id: UUID | None = None,
) -> int:
    statement = select(func.count()).select_from(Module)
    if program_id:
        statement = statement.where(Module.program_id == program_id)
    return session.exec(statement).one()


def update_module(
    *,
    session: Session,
    db_module: Module,
    module_in: ModuleUpdate,
) -> Module:
    update_data = module_in.model_dump(exclude_unset=True)

    update_data["updated_at"] = get_datetime_utc()

    db_module.sqlmodel_update(update_data)

    session.add(db_module)
    session.commit()
    session.refresh(db_module)

    return db_module

def delete_module(
    *,
    session: Session,
    db_module: Module,
) -> None:
    session.delete(db_module)
    session.commit()