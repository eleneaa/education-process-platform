import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime

from . import User
from .enums import AdmissionRequestSource, AdmissionRequestStatus
from .utils import get_datetime_utc


class AdmissionRequestBase(SQLModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str = Field(min_length=5, max_length=20)
    program_interest: str | None = Field(default=None, max_length=255)
    comment: str | None = Field(default=None, max_length=255)
    source: AdmissionRequestSource


class AdmissionRequestCreate(AdmissionRequestBase):
    pass


class AdmissionRequestUpdate(SQLModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone_number: str | None = Field(default=None, min_length=5, max_length=20)
    program_interest: str | None = Field(default=None, max_length=255)
    comment: str | None = Field(default=None, max_length=255)
    source: AdmissionRequestSource | None = None
    status: AdmissionRequestStatus | None = None
    assigned_to_id: uuid.UUID | None = None


class AdmissionRequestPublic(AdmissionRequestBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    status: AdmissionRequestStatus
    assigned_to_id: uuid.UUID | None = None


class AdmissionRequestsPublic(SQLModel):
    data: list[AdmissionRequestPublic]
    count: int

class AdmissionRequest(AdmissionRequestBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = None
    status: AdmissionRequestStatus = Field(default=AdmissionRequestStatus.NEW)
    assigned_to_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="user.id",
        nullable=True,
        ondelete="SET NULL",
    )
    assigned_to: User | None = Relationship(
        back_populates="assigned_admission_requests"
    )
