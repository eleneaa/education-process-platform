from sqlmodel import Session

from app.crud import crud_program, crud_user
from app.core.config import settings
from app.models import ProgramCreate, ProgramUpdate


def test_create_program(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_in = ProgramCreate(
        title="Python Basics",
        description="Introductory Python course",
    )

    program = crud_program.create_program(
        session=db,
        program_create=program_in,
        created_by_id=super_user.id,
    )

    assert program.id is not None
    assert program.title == program_in.title
    assert program.description == program_in.description
    assert program.created_by_id == super_user.id


def test_get_program_by_id(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_in = ProgramCreate(
        title="Analytics Program",
        description="Analytics description",
    )

    created_program = crud_program.create_program(
        session=db,
        program_create=program_in,
        created_by_id=super_user.id,
    )

    db_program = crud_program.get_program_by_id(
        session=db,
        program_id=created_program.id,
    )

    assert db_program is not None
    assert db_program.id == created_program.id
    assert db_program.title == created_program.title


def test_get_programs(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_1 = ProgramCreate(
        title="Program 1",
        description="Description 1",
    )
    program_2 = ProgramCreate(
        title="Program 2",
        description="Description 2",
    )

    crud_program.create_program(
        session=db,
        program_create=program_1,
        created_by_id=super_user.id,
    )
    crud_program.create_program(
        session=db,
        program_create=program_2,
        created_by_id=super_user.id,
    )

    programs = crud_program.get_programs(session=db)

    assert len(programs) >= 2


def test_update_program(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_in = ProgramCreate(
        title="Old Title",
        description="Old Description",
    )

    created_program = crud_program.create_program(
        session=db,
        program_create=program_in,
        created_by_id=super_user.id,
    )

    program_update = ProgramUpdate(
        title="Updated Title",
        description="Updated Description",
    )

    updated_program = crud_program.update_program(
        session=db,
        db_program=created_program,
        program_in=program_update,
    )

    assert updated_program.title == "Updated Title"
    assert updated_program.description == "Updated Description"


def test_delete_program(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_in = ProgramCreate(
        title="Delete Program",
        description="To be deleted",
    )

    created_program = crud_program.create_program(
        session=db,
        program_create=program_in,
        created_by_id=super_user.id,
    )

    crud_program.delete_program(
        session=db,
        db_program=created_program,
    )

    deleted_program = crud_program.get_program_by_id(
        session=db,
        program_id=created_program.id,
    )

    assert deleted_program is None