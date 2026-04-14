"""
Tests for Analytics and Individual Trajectory endpoints.
"""
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.crud import (
    crud_enrollment,
    crud_group,
    crud_module,
    crud_program,
    crud_progress,
    crud_user,
)
from app.models import (
    EnrollmentCreate,
    GroupCreate,
    ModuleCreate,
    ProgramCreate,
    ProgressCreate,
    UserCreate,
)
from app.models.enums import ProgressStatus
from tests.utils.utils import random_email, random_lower_string


def _make_student(db: Session) -> object:
    return crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Test Student",
        ),
    )


# ──────────────────────────────────────────────────
# Analytics: student program progress
# ──────────────────────────────────────────────────

def test_student_program_progress_no_modules(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = _make_student(db)
    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(title="Empty Program"),
        created_by_id=super_user.id,
    )

    r = client.get(
        f"{settings.API_V1_STR}/analytics/programs/{program.id}/students/{student.id}/progress",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total_modules"] == 0
    assert body["completed_modules"] == 0
    assert body["percentage"] == 0.0


def test_student_program_progress_partial(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = _make_student(db)
    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(title="Partial Program"),
        created_by_id=super_user.id,
    )
    module1 = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="M1", program_id=program.id, position=1),
    )
    module2 = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="M2", program_id=program.id, position=2),
    )

    # Complete only module1
    crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=module1.id,
            status=ProgressStatus.COMPLETED,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/analytics/programs/{program.id}/students/{student.id}/progress",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total_modules"] == 2
    assert body["completed_modules"] == 1
    assert body["percentage"] == 50.0


def test_student_program_progress_full(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = _make_student(db)
    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(title="Full Program"),
        created_by_id=super_user.id,
    )
    module1 = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="M1", program_id=program.id, position=1),
    )
    module2 = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="M2", program_id=program.id, position=2),
    )

    for mod in [module1, module2]:
        crud_progress.create_progress(
            session=db,
            progress_create=ProgressCreate(
                student_id=student.id,
                module_id=mod.id,
                status=ProgressStatus.COMPLETED,
            ),
        )

    r = client.get(
        f"{settings.API_V1_STR}/analytics/programs/{program.id}/students/{student.id}/progress",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["total_modules"] == 2
    assert body["completed_modules"] == 2
    assert body["percentage"] == 100.0


def test_student_program_progress_program_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    import uuid
    student = _make_student(db)
    r = client.get(
        f"{settings.API_V1_STR}/analytics/programs/{uuid.uuid4()}/students/{student.id}/progress",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404


# ──────────────────────────────────────────────────
# Analytics: group progress report
# ──────────────────────────────────────────────────

def test_group_progress_report(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student_a = _make_student(db)
    student_b = _make_student(db)

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(title="Group Report Program"),
        created_by_id=super_user.id,
    )
    module1 = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="R-M1", program_id=program.id, position=1),
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Report Group",
            program_id=program.id,
            start_date=datetime(2026, 1, 1),
            end_date=datetime(2026, 12, 31),
        ),
    )

    crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(student_id=student_a.id, group_id=group.id),
    )
    crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(student_id=student_b.id, group_id=group.id),
    )

    crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student_a.id,
            module_id=module1.id,
            status=ProgressStatus.COMPLETED,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/analytics/groups/{group.id}/progress",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["group_id"] == str(group.id)
    assert len(body["students"]) == 2

    # student_a: 100%, student_b: 0%
    by_student = {s["student_id"]: s for s in body["students"]}
    assert by_student[str(student_a.id)]["percentage"] == 100.0
    assert by_student[str(student_b.id)]["percentage"] == 0.0


# ──────────────────────────────────────────────────
# Trajectory
# ──────────────────────────────────────────────────

def test_trajectory_not_started(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = _make_student(db)
    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(title="Trajectory Program"),
        created_by_id=super_user.id,
    )
    crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="T-M1", program_id=program.id, position=1),
    )
    crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="T-M2", program_id=program.id, position=2),
    )

    r = client.get(
        f"{settings.API_V1_STR}/trajectory/programs/{program.id}/students/{student.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "not_started"
    assert body["percentage"] == 0.0
    assert len(body["recommendations"]) > 0
    assert body["recommendations"][0]["action"] in ("start", "continue", "revisit")


def test_trajectory_in_progress(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = _make_student(db)
    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(title="In Progress Trajectory"),
        created_by_id=super_user.id,
    )
    mod1 = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="IP-M1", program_id=program.id, position=1),
    )
    crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="IP-M2", program_id=program.id, position=2),
    )

    crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=mod1.id,
            status=ProgressStatus.COMPLETED,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/trajectory/programs/{program.id}/students/{student.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "in_progress"
    assert body["percentage"] == 50.0


def test_trajectory_completed(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student = _make_student(db)
    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(title="Completed Trajectory"),
        created_by_id=super_user.id,
    )
    mod1 = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(title="C-M1", program_id=program.id, position=1),
    )

    crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=mod1.id,
            status=ProgressStatus.COMPLETED,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/trajectory/programs/{program.id}/students/{student.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "completed"
    assert body["percentage"] == 100.0
    assert body["recommendations"] == []


def test_trajectory_program_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    import uuid
    student = _make_student(db)
    r = client.get(
        f"{settings.API_V1_STR}/trajectory/programs/{uuid.uuid4()}/students/{student.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
