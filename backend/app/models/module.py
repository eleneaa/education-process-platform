import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime, Text

from .program import Program
from .enums import ModuleType
from .utils import get_datetime_utc


class ModuleBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    position: int | None = None
    module_type: str = Field(default="theoretical")
    content: str | None = Field(default=None, sa_type=Text)  # type: ignore


class ModuleCreate(ModuleBase):
    program_id: uuid.UUID


class ModuleUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    position: int | None = None
    module_type: str | None = None
    content: str | None = None


class ModulePublic(ModuleBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    program_id: uuid.UUID


class ModulesPublic(SQLModel):
    data: list[ModulePublic]
    count: int

class Module (ModuleBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = None
    program_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="program.id",
        nullable=False,
        ondelete="CASCADE",
    )
    program: Program | None = Relationship(
        back_populates="modules",
    )
    progress_records: list["Progress"] = Relationship(
        back_populates="module"
    )
