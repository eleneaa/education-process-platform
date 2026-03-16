from datetime import datetime

from sqlmodel import Session

from app.crud import crud_group, crud_program, crud_user
from app.core.config import settings
from app.models import GroupCreate, GroupUpdate, ProgramCreate


def test_create_group(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Python Program",
            description="Program for groups",
        ),
        created_by_id=super_user.id,
    )

    group_in = GroupCreate(
        name="Group A",
        description="Morning group",
        program_id=program.id,
        teacher_id=super_user.id,
        start_date=datetime(2026, 3, 1, 10, 0, 0),
        end_date=datetime(2026, 6, 1, 10, 0, 0),
    )

    group = crud_group.create_group(
        session=db,
        group_create=group_in,
    )

    assert group.id is not None
    assert group.name == group_in.name
    assert group.description == group_in.description
    assert group.program_id == program.id
    assert group.teacher_id == super_user.id


def test_get_group_by_id(db: Session) -> None:
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

    created_group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group B",
            description="Evening group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 4, 1, 18, 0, 0),
            end_date=datetime(2026, 7, 1, 18, 0, 0),
        ),
    )

    db_group = crud_group.get_group_by_id(
        session=db,
        group_id=created_group.id,
    )

    assert db_group is not None
    assert db_group.id == created_group.id
    assert db_group.name == created_group.name


def test_get_groups(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for groups list",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group 1",
            description="Desc 1",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 5, 1, 9, 0, 0),
            end_date=datetime(2026, 8, 1, 9, 0, 0),
        ),
    )
    crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group 2",
            description="Desc 2",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 5, 2, 9, 0, 0),
            end_date=datetime(2026, 8, 2, 9, 0, 0),
        ),
    )

    groups = crud_group.get_groups(session=db)

    assert len(groups) >= 2


def test_update_group(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for group update",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    created_group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Old Group",
            description="Old description",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 6, 1, 9, 0, 0),
            end_date=datetime(2026, 9, 1, 9, 0, 0),
        ),
    )

    group_update = GroupUpdate(
        name="Updated Group",
        description="Updated description",
    )

    updated_group = crud_group.update_group(
        session=db,
        db_group=created_group,
        group_in=group_update,
    )

    assert updated_group.name == "Updated Group"
    assert updated_group.description == "Updated description"


def test_delete_group(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for group delete",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    created_group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Delete Group",
            description="To be deleted",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 7, 1, 9, 0, 0),
            end_date=datetime(2026, 10, 1, 9, 0, 0),
        ),
    )

    crud_group.delete_group(
        session=db,
        db_group=created_group,
    )

    deleted_group = crud_group.get_group_by_id(
        session=db,
        group_id=created_group.id,
    )

    assert deleted_group is None