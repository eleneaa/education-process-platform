import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime, Text

from .group import Group
from .module import Module
from .utils import get_datetime_utc


class LessonBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, sa_type=Text)  # type: ignore
    scheduled_at: datetime
    duration_minutes: int = Field(default=90)
    location: str | None = Field(default=None, max_length=255)
    series_id: uuid.UUID | None = Field(default=None)
    module_id: uuid.UUID | None = Field(default=None)


class LessonCreate(LessonBase):
    group_id: uuid.UUID


class LessonUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    location: str | None = None


class LessonPublic(LessonBase):
    id: uuid.UUID
    group_id: uuid.UUID
    created_at: datetime | None = None


class LessonsPublic(SQLModel):
    data: list[LessonPublic]
    count: int


class Lesson(LessonBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    group_id: uuid.UUID = Field(
        foreign_key="group.id",
        nullable=False,
        ondelete="CASCADE",
    )
    group: Group | None = Relationship()

    module_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="module.id",
        nullable=True,
        ondelete="SET NULL",
    )
    module: Module | None = Relationship()
