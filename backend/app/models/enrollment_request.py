import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime

from . import User
from .enums import EnrollmentRequestSource, EnrollmentRequestStatus
from .utils import get_datetime_utc


class EnrollmentRequestBase(SQLModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str = Field(min_length=5, max_length=20)
    program_interest: str | None = Field(default=None, max_length=255)
    comment: str | None = Field(default=None, max_length=255)
    source: EnrollmentRequestSource


class EnrollmentRequestCreate(EnrollmentRequestBase):
    pass


class EnrollmentRequestUpdate(SQLModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str | None = Field(default=None, min_length=5, max_length=20)
    program_interest: str | None = Field(default=None, max_length=255)
    comment: str | None = Field(default=None, max_length=255)
    source: EnrollmentRequestSource | None = None
    status: EnrollmentRequestStatus | None = None
    assigned_to_id: uuid.UUID | None = None


class EnrollmentRequestPublic(EnrollmentRequestBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    status: EnrollmentRequestStatus
    assigned_to_id: uuid.UUID | None = None


class EnrollmentRequestsPublic(SQLModel):
    data: list[EnrollmentRequestPublic]
    count: int

class EnrollmentRequest(EnrollmentRequestBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = None
    status: EnrollmentRequestStatus = Field(default=EnrollmentRequestStatus.NEW)
    assigned_to_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="user.id",
        nullable=True,
        ondelete="SET NULL",
    )
    assigned_to: User | None = Relationship(
        back_populates="assigned_enrollment_requests"
    )
