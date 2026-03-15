import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.crud import crud_admission_request
from app.core.config import settings
from app.models import AdmissionRequest, AdmissionRequestCreate


def test_create_admission_request(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    data = {
        "full_name": "Ivan Petrov",
        "email": "ivan.petrov@example.com",
        "phone_number": "+79990001122",
        "program_interest": "Data Science",
        "comment": "Wants evening classes",
        "source": "website",
    }

    r = client.post(
        f"{settings.API_V1_STR}/admission-requests/",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    created_request = r.json()
    assert created_request["full_name"] == data["full_name"]
    assert created_request["email"] == data["email"]
    assert created_request["phone_number"] == data["phone_number"]
    assert created_request["program_interest"] == data["program_interest"]
    assert created_request["comment"] == data["comment"]
    assert created_request["source"] == data["source"]

    db_obj = db.exec(
        select(AdmissionRequest).where(AdmissionRequest.id == created_request["id"])
    ).first()
    assert db_obj is not None


def test_get_admission_requests(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    req_1 = AdmissionRequestCreate(
        full_name="First User",
        email="first@example.com",
        phone_number="+79990000001",
        program_interest="Program 1",
        comment="First comment",
        source="website",
    )
    req_2 = AdmissionRequestCreate(
        full_name="Second User",
        email="second@example.com",
        phone_number="+79990000002",
        program_interest="Program 2",
        comment="Second comment",
        source="email",
    )

    crud_admission_request.create_admission_request(session=db, admission_request_create=req_1)
    crud_admission_request.create_admission_request(session=db, admission_request_create=req_2)

    r = client.get(
        f"{settings.API_V1_STR}/admission-requests/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert "data" in body
    assert "count" in body
    assert body["count"] >= 2
    assert len(body["data"]) >= 2


def test_get_admission_request_by_id(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    request_in = AdmissionRequestCreate(
        full_name="Anna Smirnova",
        email="anna@example.com",
        phone_number="+79991112233",
        program_interest="Python Developer",
        comment="Interested in online format",
        source="website",
    )
    admission_request = crud_admission_request.create_admission_request(
        session=db,
        admission_request_create=request_in,
    )

    r = client.get(
        f"{settings.API_V1_STR}/admission-requests/{admission_request.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["id"] == str(admission_request.id)
    assert body["full_name"] == admission_request.full_name
    assert body["email"] == admission_request.email


def test_get_admission_request_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/admission-requests/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Admission request not found"


def test_update_admission_request(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    request_in = AdmissionRequestCreate(
        full_name="Maria Ivanova",
        email="maria@example.com",
        phone_number="+79995556677",
        program_interest="Analytics",
        comment="Initial comment",
        source="phone",
    )
    admission_request = crud_admission_request.create_admission_request(
        session=db,
        admission_request_create=request_in,
    )

    data = {
        "status": "in_review",
        "comment": "Updated by admin",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/admission-requests/{admission_request.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200

    body = r.json()
    assert body["status"] == "in_review"
    assert body["comment"] == "Updated by admin"


def test_update_admission_request_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    data = {
        "status": "in_review",
    }

    r = client.patch(
        f"{settings.API_V1_STR}/admission-requests/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Admission request not found"


def test_delete_admission_request(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    request_in = AdmissionRequestCreate(
        full_name="Delete Me",
        email="delete@example.com",
        phone_number="+79998887766",
        program_interest="Testing",
        comment="To be deleted",
        source="telegram",
    )
    admission_request = crud_admission_request.create_admission_request(
        session=db,
        admission_request_create=request_in,
    )

    r = client.delete(
        f"{settings.API_V1_STR}/admission-requests/{admission_request.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    db_obj = db.exec(
        select(AdmissionRequest).where(AdmissionRequest.id == admission_request.id)
    ).first()
    assert db_obj is None


def test_delete_admission_request_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.delete(
        f"{settings.API_V1_STR}/admission-requests/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Admission request not found"