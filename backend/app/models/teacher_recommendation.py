import uuid
from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime

from . import User
from .program import Program
from .utils import get_datetime_utc


class TeacherRecommendationBase(SQLModel):
    student_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    teacher_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    program_id: uuid.UUID = Field(foreign_key="program.id", nullable=False, ondelete="CASCADE")
    comment: str | None = Field(default=None, max_length=500)


class TeacherRecommendationCreate(SQLModel):
    """Create a new recommendation. teacher_id is set by the server from current user."""
    student_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    program_id: uuid.UUID = Field(foreign_key="program.id", nullable=False, ondelete="CASCADE")
    comment: str | None = Field(default=None, max_length=500)


class TeacherRecommendationUpdate(SQLModel):
    comment: str | None = Field(default=None, max_length=500)


class TeacherRecommendationPublic(TeacherRecommendationBase):
    id: uuid.UUID
    created_at: datetime | None = None


class TeacherRecommendation(TeacherRecommendationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    student: User = Relationship(
        back_populates="received_recommendations",
        sa_relationship_kwargs={
            "primaryjoin": "TeacherRecommendation.student_id==User.id",
            "foreign_keys": "TeacherRecommendation.student_id"
        }
    )
    teacher: User = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "TeacherRecommendation.teacher_id==User.id",
            "foreign_keys": "TeacherRecommendation.teacher_id"
        }
    )
    program: Program = Relationship()
