import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.crud import crud_program, crud_user
from app.core.config import settings
from app.models import Program, ProgramCreate


def test_create_program(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    data = {
        "title": "Python Basics",
        "description": "Introductory Python course",
    }

    r = client.post(
        f"{settings.API_V1_STR}/programs/",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    created_program = r.json()
    assert created_program["title"] == data["title"]
    assert created_program["description"] == data["description"]
    assert created_program["created_by_id"] is not None

    db_obj = db.exec(
        select(Program).where(Program.id == created_program["id"])
    ).first()
    assert db_obj is not None
    assert db_obj.title == data["title"]


def test_get_programs(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    program_1 = ProgramCreate(
        title="Program 1",
        description="Description 1",
    )
    program_2 = ProgramCreate(
        title="Program 2",
        description="Description 2",
    )

    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

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

    r = client.get(
        f"{settings.API_V1_STR}/programs/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert "data" in body
    assert "count" in body
    assert body["count"] >= 2
    assert len(body["data"]) >= 2


def test_get_program_by_id(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_in = ProgramCreate(
        title="Analytics Program",
        description="Analytics description",
    )
    program = crud_program.create_program(
        session=db,
        program_create=program_in,
        created_by_id=super_user.id,
    )

    r = client.get(
        f"{settings.API_V1_STR}/programs/{program.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["id"] == str(program.id)
    assert body["title"] == program.title
    assert body["description"] == program.description


def test_get_program_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/programs/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Program not found"


def test_update_program(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_in = ProgramCreate(
        title="Old Title",
        description="Old Description",
    )
    program = crud_program.create_program(
        session=db,
        program_create=program_in,
        created_by_id=super_user.id,
    )

    data = {
        "title": "Updated Title",
        "description": "Updated Description",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/programs/{program.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["title"] == "Updated Title"
    assert body["description"] == "Updated Description"


def test_update_program_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    data = {
        "title": "Updated Title",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/programs/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Program not found"


def test_delete_program(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program_in = ProgramCreate(
        title="Delete Program",
        description="To be deleted",
    )
    program = crud_program.create_program(
        session=db,
        program_create=program_in,
        created_by_id=super_user.id,
    )

    r = client.delete(
        f"{settings.API_V1_STR}/programs/{program.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    db_obj = db.exec(
        select(Program).where(Program.id == program.id)
    ).first()
    assert db_obj is None


def test_delete_program_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.delete(
        f"{settings.API_V1_STR}/programs/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Program not found"