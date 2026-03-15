from sqlmodel import Session

from app import crud
from app.models import AdmissionRequestCreate, AdmissionRequestUpdate


def test_create_admission_request(db: Session) -> None:
    request_in = AdmissionRequestCreate(
        full_name="Ivan Petrov",
        email="ivan.petrov@example.com",
        phone_number="+79990001122",
        program_interest="Data Science",
        comment="Wants evening classes",
        source="WEBSITE",
    )

    admission_request = crud.create_admission_request(
        session=db,
        admission_request_create=request_in,
    )

    assert admission_request.id is not None
    assert admission_request.full_name == request_in.full_name
    assert admission_request.email == request_in.email
    assert admission_request.phone_number == request_in.phone_number
    assert admission_request.program_interest == request_in.program_interest
    assert admission_request.comment == request_in.comment
    assert admission_request.source == request_in.source


def test_get_admission_request_by_id(db: Session) -> None:
    request_in = AdmissionRequestCreate(
        full_name="Anna Smirnova",
        email="anna@example.com",
        phone_number="+79991112233",
        program_interest="Python Developer",
        comment="Interested in online format",
        source="WEBSITE",
    )

    created_request = crud.create_admission_request(
        session=db,
        admission_request_create=request_in,
    )

    db_request = crud.get_admission_request_by_id(
        session=db,
        admission_request_id=created_request.id,
    )

    assert db_request is not None
    assert db_request.id == created_request.id
    assert db_request.full_name == created_request.full_name


def test_get_admission_requests(db: Session) -> None:
    request_1 = AdmissionRequestCreate(
        full_name="First User",
        email="first@example.com",
        phone_number="+79990000001",
        program_interest="Program 1",
        comment="First comment",
        source="WEBSITE",
    )
    request_2 = AdmissionRequestCreate(
        full_name="Second User",
        email="second@example.com",
        phone_number="+79990000002",
        program_interest="Program 2",
        comment="Second comment",
        source="EMAIL",
    )

    crud.create_admission_request(session=db, admission_request_create=request_1)
    crud.create_admission_request(session=db, admission_request_create=request_2)

    requests = crud.get_admission_requests(session=db)

    assert len(requests) >= 2


def test_update_admission_request(db: Session) -> None:
    request_in = AdmissionRequestCreate(
        full_name="Maria Ivanova",
        email="maria@example.com",
        phone_number="+79995556677",
        program_interest="Analytics",
        comment="Initial comment",
        source="PHONE",
    )

    created_request = crud.create_admission_request(
        session=db,
        admission_request_create=request_in,
    )

    request_update = AdmissionRequestUpdate(
        status="IN_REVIEW",
        comment="Updated by admin",
    )

    updated_request = crud.update_admission_request(
        session=db,
        db_admission_request=created_request,
        enrollment_request_in=request_update,
    )

    assert updated_request.status.value == "IN_REVIEW"
    assert updated_request.comment == "Updated by admin"


def test_delete_admission_request(db: Session) -> None:
    request_in = AdmissionRequestCreate(
        full_name="Delete Me",
        email="delete@example.com",
        phone_number="+79998887766",
        program_interest="Testing",
        comment="To be deleted",
        source="TELEGRAM",
    )

    created_request = crud.create_admission_request(
        session=db,
        admission_request_create=request_in,
    )

    crud.delete_admission_request(
        session=db,
        db_admission_request=created_request,
    )

    deleted_request = crud.get_admission_request_by_id(
        session=db,
        admission_request_id=created_request.id,
    )

    assert deleted_request is None