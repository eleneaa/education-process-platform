import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship

from . import User
from .enums import ProgressStatus
from .module import Module
from .utils import get_datetime_utc


class ProgressBase(SQLModel):
    status: ProgressStatus = Field(default=ProgressStatus.NOT_STARTED)
    score: float | None = None
    completed_at: datetime | None = None


class ProgressCreate(ProgressBase):
    student_id: uuid.UUID
    module_id: uuid.UUID


class ProgressUpdate(SQLModel):
    status: ProgressStatus | None = None
    score: float | None = None
    completed_at: datetime | None = None

class ProgressPublic(ProgressBase):
    id: uuid.UUID
    student_id: uuid.UUID
    module_id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ProgressesPublic(SQLModel):
    data: list[ProgressPublic]
    count: int

class Progress(ProgressBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = None
    student_id: uuid.UUID = Field(
        foreign_key="user.id",
        nullable=False,
        ondelete="CASCADE",
    )
    student: User | None = Relationship(
        back_populates="progress_records",
    )

    module_id: uuid.UUID = Field(
        foreign_key="module.id",
        nullable=False,
        ondelete="CASCADE",
    )

    module: Module | None = Relationship(
        back_populates="progress_records",
    )
    status: ProgressStatus = Field(default=ProgressStatus.NOT_STARTED)
    score: float | None = None
    completed_at: datetime | None = None
