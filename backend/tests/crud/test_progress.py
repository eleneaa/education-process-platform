from datetime import datetime

from sqlmodel import Session

from app.crud import crud_group, crud_module, crud_program, crud_progress, crud_user
from app.core.config import settings
from app.models import (
    GroupCreate,
    ModuleCreate,
    ProgramCreate,
    ProgressCreate,
    ProgressUpdate,
    UserCreate,
)
from tests.utils.utils import random_email, random_lower_string


def test_create_progress(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Progress One",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for progress",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module A",
            description="Module for progress",
            position=1,
            program_id=program.id,
        ),
    )

    progress = crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=module.id,
            score=85.5,
        ),
    )

    assert progress.id is not None
    assert progress.student_id == student.id
    assert progress.module_id == module.id
    assert progress.score == 85.5


def test_get_progress_by_id(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Progress Two",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for single progress",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module B",
            description="Single progress module",
            position=1,
            program_id=program.id,
        ),
    )

    created_progress = crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=module.id,
            score=70.0,
        ),
    )

    db_progress = crud_progress.get_progress_by_id(
        session=db,
        progress_id=created_progress.id,
    )

    assert db_progress is not None
    assert db_progress.id == created_progress.id


def test_get_progresses(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student_1 = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Progress Three",
        ),
    )
    student_2 = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Progress Four",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for progresses list",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module C",
            description="List progress module",
            position=1,
            program_id=program.id,
        ),
    )

    crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student_1.id,
            module_id=module.id,
            score=60.0,
        ),
    )
    crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student_2.id,
            module_id=module.id,
            score=90.0,
        ),
    )

    progresses = crud_progress.get_progresses(session=db)

    assert len(progresses) >= 2


def test_update_progress(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Progress Five",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for progress update",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module D",
            description="Update progress module",
            position=1,
            program_id=program.id,
        ),
    )

    created_progress = crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=module.id,
            score=50.0,
        ),
    )

    updated_progress = crud_progress.update_progress(
        session=db,
        db_progress=created_progress,
        progress_in=ProgressUpdate(
            status="completed",
            score=95.0,
            completed_at=datetime(2026, 6, 1, 12, 0, 0),
        ),
    )

    assert updated_progress.status.value == "completed"
    assert updated_progress.score == 95.0


def test_delete_progress(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Progress Six",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for progress delete",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module E",
            description="Delete progress module",
            position=1,
            program_id=program.id,
        ),
    )

    created_progress = crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=module.id,
            score=40.0,
        ),
    )

    crud_progress.delete_progress(
        session=db,
        db_progress=created_progress,
    )

    deleted_progress = crud_progress.get_progress_by_id(
        session=db,
        progress_id=created_progress.id,
    )

    assert deleted_progress is None