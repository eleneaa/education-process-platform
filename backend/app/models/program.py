import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship

from . import User
from .enums import ProgramStatus
from .utils import get_datetime_utc


class ProgramBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    status: ProgramStatus | None = None


class ProgramPublic(ProgramBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    status: ProgramStatus = Field(default=ProgramStatus.DRAFT)
    created_by_id: uuid.UUID | None = None


class ProgramsPublic(SQLModel):
    data: list[ProgramPublic]
    count: int

class Program (ProgramBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = None
    status: ProgramStatus = Field(default=ProgramStatus.DRAFT)
    created_by_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="user.id",
        nullable=True,
        ondelete="SET NULL",
    )
    created_by: User | None = Relationship(
        back_populates="created_programs",
    )
