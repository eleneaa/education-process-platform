"""Tests for program-teacher relationships."""
from sqlmodel import Session

from app.crud import crud_program, crud_user
from app.core.config import settings
from app.models import ProgramCreate, UserCreate, UserRole


def test_add_teacher_to_program(db: Session) -> None:
    """Test adding a teacher to a program."""
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    # Create a teacher
    teacher = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email="test_teacher_add@example.com",
            password="password123",
            full_name="Test Teacher Add",
            role=UserRole.TEACHER,
        ),
    )

    # Create a program
    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Test Program",
            description="For testing",
        ),
        created_by_id=super_user.id,
    )

    # Add teacher to program
    pt = crud_program.add_teacher_to_program(
        session=db,
        program_id=program.id,
        teacher_id=teacher.id,
    )

    assert pt.program_id == program.id
    assert pt.teacher_id == teacher.id


def test_remove_teacher_from_program(db: Session) -> None:
    """Test removing a teacher from a program."""
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    teacher = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email="test_teacher_remove@example.com",
            password="password123",
            full_name="Test Teacher Remove",
            role=UserRole.TEACHER,
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Test Program 2",
            description="For testing",
        ),
        created_by_id=super_user.id,
    )

    # Add and then remove
    crud_program.add_teacher_to_program(
        session=db,
        program_id=program.id,
        teacher_id=teacher.id,
    )

    crud_program.remove_teacher_from_program(
        session=db,
        program_id=program.id,
        teacher_id=teacher.id,
    )

    # Refresh to check
    db.refresh(program)
    assert len(program.teachers) == 0


def test_get_programs_by_teacher(db: Session) -> None:
    """Test retrieving programs for a specific teacher."""
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    teacher = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email="test_teacher_get@example.com",
            password="password123",
            full_name="Test Teacher Get",
            role=UserRole.TEACHER,
        ),
    )

    # Create 2 programs
    program1 = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program 1",
            description="Test",
        ),
        created_by_id=super_user.id,
    )

    program2 = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program 2",
            description="Test",
        ),
        created_by_id=super_user.id,
    )

    # Add teacher to both programs
    crud_program.add_teacher_to_program(session=db, program_id=program1.id, teacher_id=teacher.id)
    crud_program.add_teacher_to_program(session=db, program_id=program2.id, teacher_id=teacher.id)

    # Get programs by teacher
    programs = crud_program.get_programs_by_teacher(
        session=db,
        teacher_id=teacher.id,
    )

    assert len(programs) == 2
    assert program1.id in [p.id for p in programs]
    assert program2.id in [p.id for p in programs]
