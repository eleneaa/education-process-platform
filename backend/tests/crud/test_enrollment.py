from datetime import datetime

from sqlmodel import Session

from app.crud import crud_enrollment, crud_group, crud_program, crud_user
from app.core.config import settings
from app.models import EnrollmentCreate, EnrollmentUpdate, GroupCreate, ProgramCreate, UserCreate
from tests.utils.utils import random_email, random_lower_string


def test_create_enrollment(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student One",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Python Program",
            description="Program for enrollments",
        ),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group A",
            description="Morning group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 3, 1, 10, 0, 0),
            end_date=datetime(2026, 6, 1, 10, 0, 0),
        ),
    )

    enrollment = crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student.id,
            group_id=group.id,
        ),
    )

    assert enrollment.id is not None
    assert enrollment.student_id == student.id
    assert enrollment.group_id == group.id


def test_get_enrollment_by_id(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Two",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Analytics Program",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
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

    created_enrollment = crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student.id,
            group_id=group.id,
        ),
    )

    db_enrollment = crud_enrollment.get_enrollment_by_id(
        session=db,
        enrollment_id=created_enrollment.id,
    )

    assert db_enrollment is not None
    assert db_enrollment.id == created_enrollment.id


def test_get_enrollments(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student_1 = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Three",
        ),
    )
    student_2 = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Four",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for enrollments list",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group C",
            description="List group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 5, 1, 9, 0, 0),
            end_date=datetime(2026, 8, 1, 9, 0, 0),
        ),
    )

    crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student_1.id,
            group_id=group.id,
        ),
    )
    crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student_2.id,
            group_id=group.id,
        ),
    )

    enrollments = crud_enrollment.get_enrollments(session=db)

    assert len(enrollments) >= 2


def test_update_enrollment(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Five",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for enrollment update",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group D",
            description="Update group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 6, 1, 9, 0, 0),
            end_date=datetime(2026, 9, 1, 9, 0, 0),
        ),
    )

    created_enrollment = crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student.id,
            group_id=group.id,
        ),
    )

    updated_enrollment = crud_enrollment.update_enrollment(
        session=db,
        db_enrollment=created_enrollment,
        enrollment_in=EnrollmentUpdate(status="completed"),
    )

    assert updated_enrollment.status.value == "completed"


def test_delete_enrollment(db: Session) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Six",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for enrollment delete",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group E",
            description="Delete group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 7, 1, 9, 0, 0),
            end_date=datetime(2026, 10, 1, 9, 0, 0),
        ),
    )

    created_enrollment = crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student.id,
            group_id=group.id,
        ),
    )

    crud_enrollment.delete_enrollment(
        session=db,
        db_enrollment=created_enrollment,
    )

    deleted_enrollment = crud_enrollment.get_enrollment_by_id(
        session=db,
        enrollment_id=created_enrollment.id,
    )

    assert deleted_enrollment is None