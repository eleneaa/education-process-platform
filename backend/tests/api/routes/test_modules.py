import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.crud import crud_module, crud_user, crud_program
from app.core.config import settings
from app.models import Module, ModuleCreate, ProgramCreate


def test_create_module(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Python Program",
            description="Program for module creation",
        ),
        created_by_id=super_user.id,
    )

    data = {
        "title": "Introduction",
        "description": "First module",
        "position": 1,
        "program_id": str(program.id),
    }

    r = client.post(
        f"{settings.API_V1_STR}/modules/",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    created_module = r.json()
    assert created_module["title"] == data["title"]
    assert created_module["description"] == data["description"]
    assert created_module["position"] == data["position"]
    assert created_module["program_id"] == str(program.id)

    db_obj = db.exec(
        select(Module).where(Module.id == created_module["id"])
    ).first()
    assert db_obj is not None


def test_get_modules(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for list",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module 1",
            description="Desc 1",
            position=1,
            program_id=program.id,
        ),
    )
    crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module 2",
            description="Desc 2",
            position=2,
            program_id=program.id,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/modules/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert "data" in body
    assert "count" in body
    assert body["count"] >= 2
    assert len(body["data"]) >= 2


def test_get_module_by_id(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for single module",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Module A",
            description="Description A",
            position=1,
            program_id=program.id,
        ),
    )

    r = client.get(
        f"{settings.API_V1_STR}/modules/{module.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["id"] == str(module.id)
    assert body["title"] == module.title
    assert body["description"] == module.description
    assert body["position"] == module.position


def test_get_module_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/modules/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Module not found"


def test_update_module(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for update",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Old Title",
            description="Old Description",
            position=1,
            program_id=program.id,
        ),
    )

    data = {
        "title": "Updated Title",
        "description": "Updated Description",
        "position": 2,
    }

    r = client.patch(
        f"{settings.API_V1_STR}/modules/{module.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["title"] == "Updated Title"
    assert body["description"] == "Updated Description"
    assert body["position"] == 2


def test_update_module_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    data = {
        "title": "Updated Title",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/modules/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Module not found"


def test_delete_module(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(
            title="Program for delete",
            description="Program description",
        ),
        created_by_id=super_user.id,
    )

    module = crud_module.create_module(
        session=db,
        module_create=ModuleCreate(
            title="Delete Module",
            description="To be deleted",
            position=1,
            program_id=program.id,
        ),
    )

    r = client.delete(
        f"{settings.API_V1_STR}/modules/{module.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    db_obj = db.exec(
        select(Module).where(Module.id == module.id)
    ).first()
    assert db_obj is None


def test_delete_module_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.delete(
        f"{settings.API_V1_STR}/modules/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Module not found"