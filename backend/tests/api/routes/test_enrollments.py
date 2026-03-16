import uuid
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.crud import crud_enrollment, crud_group, crud_program, crud_user
from app.core.config import settings
from app.models import Enrollment, EnrollmentCreate, GroupCreate, ProgramCreate, UserCreate
from tests.utils.utils import random_email, random_lower_string


def test_create_enrollment(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Seven",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for enrollment creation",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group F",
            description="Creation group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 3, 1, 10, 0, 0),
            end_date=datetime(2026, 6, 1, 10, 0, 0),
        ),
    )

    data = {
        "student_id": str(student.id),
        "group_id": str(group.id),
    }

    r = client.post(
        f"{settings.API_V1_STR}/enrollments/",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    created_enrollment = r.json()
    assert created_enrollment["student_id"] == str(student.id)
    assert created_enrollment["group_id"] == str(group.id)

    db_obj = db.exec(
        select(Enrollment).where(Enrollment.id == created_enrollment["id"])
    ).first()
    assert db_obj is not None


def test_get_enrollments(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student_1 = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Eight",
        ),
    )
    student_2 = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Nine",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for enrollment list",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group G",
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

    r = client.get(
        f"{settings.API_V1_STR}/enrollments/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert "data" in body
    assert "count" in body
    assert body["count"] >= 2
    assert len(body["data"]) >= 2


def test_get_enrollment_by_id(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Ten",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for single enrollment",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Group H",
            description="Single group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 4, 1, 18, 0, 0),
            end_date=datetime(2026, 7, 1, 18, 0, 0),
        ),
    )

    enrollment = crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student.id,
            group_id=group.id,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/enrollments/{enrollment.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["id"] == str(enrollment.id)
    assert body["student_id"] == str(student.id)
    assert body["group_id"] == str(group.id)


def test_get_enrollment_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/enrollments/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Enrollment not found"


def test_update_enrollment(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Eleven",
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
            name="Group I",
            description="Update group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 6, 1, 9, 0, 0),
            end_date=datetime(2026, 9, 1, 9, 0, 0),
        ),
    )

    enrollment = crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student.id,
            group_id=group.id,
        ),
    )

    data = {
        "status": "completed",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/enrollments/{enrollment.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["status"] == "completed"


def test_update_enrollment_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    data = {
        "status": "completed",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/enrollments/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Enrollment not found"


def test_delete_enrollment(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Twelve",
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
            name="Group J",
            description="Delete group",
            program_id=program.id,
            teacher_id=super_user.id,
            start_date=datetime(2026, 7, 1, 9, 0, 0),
            end_date=datetime(2026, 10, 1, 9, 0, 0),
        ),
    )

    enrollment = crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(
            student_id=student.id,
            group_id=group.id,
        ),
    )

    r = client.delete(
        f"{settings.API_V1_STR}/enrollments/{enrollment.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    db_obj = db.exec(
        select(Enrollment).where(Enrollment.id == enrollment.id)
    ).first()
    assert db_obj is None


def test_delete_enrollment_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.delete(
        f"{settings.API_V1_STR}/enrollments/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Enrollment not found"