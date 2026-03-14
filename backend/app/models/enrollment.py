import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship

from . import User
from .enums import EnrollmentStatus
from .group import Group
from .utils import get_datetime_utc


class EnrollmentBase(SQLModel):
    status: EnrollmentStatus = Field(default=EnrollmentStatus.ACTIVE)


class EnrollmentCreate(EnrollmentBase):
    student_id: uuid.UUID
    group_id: uuid.UUID


class EnrollmentUpdate(SQLModel):
    status: EnrollmentStatus | None = None

class EnrollmentPublic(EnrollmentBase):
    id: uuid.UUID
    student_id: uuid.UUID
    group_id: uuid.UUID
    created_at: datetime | None = None


class EnrollmentsPublic(SQLModel):
    data: list[EnrollmentPublic]
    count: int

class Enrollment(EnrollmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    student_id: uuid.UUID = Field(
        foreign_key="user.id",
        nullable=False,
        ondelete="CASCADE",
    )
    student: User = Relationship(
        back_populates="enrollments",
    )

    group_id: uuid.UUID = Field(
        foreign_key="group.id",
        nullable=False,
        ondelete="CASCADE",
    )

    group: Group | None = Relationship(
        back_populates="enrollments",
    )
