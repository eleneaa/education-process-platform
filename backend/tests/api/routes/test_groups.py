import uuid
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.crud import crud_group, crud_program, crud_user
from app.core.config import settings
from app.models import Group, GroupCreate, ProgramCreate


def test_create_group(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for group creation",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    data = {
        "name": "Group A",
        "description": "Morning group",
        "program_id": str(program.id),
        "teacher_id": str(super_user.id),
        "start_date": "2026-03-01T10:00:00",
        "end_date": "2026-06-01T10:00:00",
    }

    r = client.post(
        f"{settings.API_V1_STR}/groups/",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    created_group = r.json()
    assert created_group["name"] == data["name"]
    assert created_group["description"] == data["description"]
    assert created_group["program_id"] == str(program.id)
    assert created_group["teacher_id"] == str(super_user.id)

    db_obj = db.exec(
        select(Group).where(Group.id == created_group["id"])
    ).first()
    assert db_obj is not None


def test_get_groups(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
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

    r = client.get(
        f"{settings.API_V1_STR}/groups/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert "data" in body
    assert "count" in body
    assert body["count"] >= 2
    assert len(body["data"]) >= 2


def test_get_group_by_id(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for single group",
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

    r = client.get(
        f"{settings.API_V1_STR}/groups/{group.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["id"] == str(group.id)
    assert body["name"] == group.name
    assert body["description"] == group.description


def test_get_group_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/groups/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Group not found"


def test_update_group(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
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

    group = crud_group.create_group(
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

    data = {
        "name": "Updated Group",
        "description": "Updated description",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/groups/{group.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["name"] == "Updated Group"
    assert body["description"] == "Updated description"


def test_update_group_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    data = {
        "name": "Updated Group",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/groups/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Group not found"


def test_delete_group(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
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

    group = crud_group.create_group(
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

    r = client.delete(
        f"{settings.API_V1_STR}/groups/{group.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    db_obj = db.exec(
        select(Group).where(Group.id == group.id)
    ).first()
    assert db_obj is None


def test_delete_group_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.delete(
        f"{settings.API_V1_STR}/groups/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Group not found"