import uuid
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.crud import crud_module, crud_program, crud_progress, crud_user
from app.core.config import settings
from app.models import ModuleCreate, ProgramCreate, Progress, ProgressCreate, UserCreate
from tests.utils.utils import random_email, random_lower_string


def test_create_progress(
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
            full_name="Student Progress Seven",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for progress creation",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module F",
            description="Create progress module",
            position=1,
            program_id=program.id,
        ),
    )

    data = {
        "student_id": str(student.id),
        "module_id": str(module.id),
        "score": 88.0,
    }

    r = client.post(
        f"{settings.API_V1_STR}/progresses/",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    created_progress = r.json()
    assert created_progress["student_id"] == str(student.id)
    assert created_progress["module_id"] == str(module.id)
    assert created_progress["score"] == 88.0

    db_obj = db.exec(
        select(Progress).where(Progress.id == created_progress["id"])
    ).first()
    assert db_obj is not None


def test_get_progresses(
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
            full_name="Student Progress Eight",
        ),
    )
    student_2 = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(),
            password=random_lower_string(),
            full_name="Student Progress Nine",
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for progress list",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module G",
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
            score=75.0,
        ),
    )
    crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student_2.id,
            module_id=module.id,
            score=92.0,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/progresses/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert "data" in body
    assert "count" in body
    assert body["count"] >= 2
    assert len(body["data"]) >= 2


def test_get_progress_by_id(
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
            full_name="Student Progress Ten",
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
            title="Module H",
            description="Single progress module",
            position=1,
            program_id=program.id,
        ),
    )

    progress = crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=module.id,
            score=65.0,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/progresses/{progress.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["id"] == str(progress.id)
    assert body["student_id"] == str(student.id)
    assert body["module_id"] == str(module.id)


def test_get_progress_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/progresses/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Progress not found"


def test_update_progress(
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
            full_name="Student Progress Eleven",
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
            title="Module I",
            description="Update progress module",
            position=1,
            program_id=program.id,
        ),
    )

    progress = crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=module.id,
            score=55.0,
        ),
    )

    data = {
        "status": "completed",
        "score": 98.0,
        "completed_at": "2026-06-01T12:00:00",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/progresses/{progress.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["status"] == "completed"
    assert body["score"] == 98.0


def test_update_progress_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    data = {
        "status": "completed",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/progresses/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Progress not found"


def test_delete_progress(
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
            full_name="Student Progress Twelve",
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
            title="Module J",
            description="Delete progress module",
            position=1,
            program_id=program.id,
        ),
    )

    progress = crud_progress.create_progress(
        session=db,
        progress_create=ProgressCreate(
            student_id=student.id,
            module_id=module.id,
            score=35.0,
        ),
    )

    r = client.delete(
        f"{settings.API_V1_STR}/progresses/{progress.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    db_obj = db.exec(
        select(Progress).where(Progress.id == progress.id)
    ).first()
    assert db_obj is None


def test_delete_progress_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.delete(
        f"{settings.API_V1_STR}/progresses/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Progress not found"