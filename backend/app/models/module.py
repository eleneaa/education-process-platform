import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship

from .program import Program
from .utils import get_datetime_utc


class ModuleBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    position: int | None = None


class ModuleCreate(ModuleBase):
    program_id: uuid.UUID


class ModuleUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    position: int | None = None


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
        nullable=True,
        ondelete="CASCADE",
    )
    program: Program | None = Relationship(
        back_populates="modules",
    )
