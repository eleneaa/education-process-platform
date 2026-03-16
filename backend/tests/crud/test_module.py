from sqlmodel import Session

from app.crud import crud_module, crud_user, crud_program
from app.core.config import settings
from app.models import ModuleCreate, ModuleUpdate, ProgramCreate


def test_create_module(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_in = ProgramCreate(
        title="Python Program",
        description="Program for modules",
    )
    program = crud_program.create_program(
        session=db,
        program_create=program_in,
        created_by_id=super_user.id,
    )

    module_in = ModuleCreate(
        title="Introduction",
        description="First module",
        position=1,
        program_id=program.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=module_in,
    )

    assert module.id is not None
    assert module.title == module_in.title
    assert module.description == module_in.description
    assert module.position == module_in.position
    assert module.program_id == program.id


def test_get_module_by_id(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Analytics Program",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    created_module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module A",
            description="Description A",
            position=1,
            program_id=program.id,
        ),
    )

    db_module = crud_module.get_module_by_id(
        session=db,
        module_id=created_module.id,
    )

    assert db_module is not None
    assert db_module.id == created_module.id
    assert db_module.title == created_module.title


def test_get_modules(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for list",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module 1",
            description="Desc 1",
            position=1,
            program_id=program.id,
        ),
    )
    crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module 2",
            description="Desc 2",
            position=2,
            program_id=program.id,
        ),
    )

    modules = crud_module.get_modules(session=db)

    assert len(modules) >= 2


def test_update_module(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for update",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    created_module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Old Title",
            description="Old Description",
            position=1,
            program_id=program.id,
        ),
    )

    module_update = ModuleUpdate(
        title="Updated Title",
        description="Updated Description",
        position=2,
    )

    updated_module = crud_module.update_module(
        session=db,
        db_module=created_module,
        module_in=module_update,
    )

    assert updated_module.title == "Updated Title"
    assert updated_module.description == "Updated Description"
    assert updated_module.position == 2


def test_delete_module(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for delete",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    created_module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Delete Module",
            description="To be deleted",
            position=1,
            program_id=program.id,
        ),
    )

    crud_module.delete_module(
        session=db,
        db_module=created_module,
    )

    deleted_module = crud_module.get_module_by_id(
        session=db,
        module_id=created_module.id,
    )

    assert deleted_module is None