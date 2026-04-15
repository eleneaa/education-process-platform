import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime

from . import User
from .enums import GroupStatus
from .program import Program
from .utils import get_datetime_utc


class GroupBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class GroupCreate(GroupBase):
    program_id: uuid.UUID
    teacher_id: uuid.UUID | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class GroupUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    teacher_id: uuid.UUID | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: GroupStatus | None = None


class GroupPublic(GroupBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None
    program_id: uuid.UUID
    teacher_id: uuid.UUID | None = None
    teacher_name: str | None = None
    student_count: int = 0
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: GroupStatus = Field(default=GroupStatus.PLANNED)



class GroupsPublic(SQLModel):
    data: list[GroupPublic]
    count: int

class Group (GroupBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    program_id: uuid.UUID = Field(
        foreign_key="program.id",
        nullable=False,
        ondelete="CASCADE",
    )
    program: Program | None = Relationship(
        back_populates="groups",
    )

    teacher_id: uuid.UUID | None= Field(
        foreign_key="user.id",
        nullable=True,
        ondelete="SET NULL",
    )

    teacher: User | None = Relationship(
        back_populates="teaching_groups",
    )

    status: GroupStatus = Field(default=GroupStatus.PLANNED)

    enrollments: list["Enrollment"] = Relationship(
        back_populates="group",
    )