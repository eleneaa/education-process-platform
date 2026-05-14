"""Attendance tracking model."""
import uuid
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field


class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"


class AttendanceBase(SQLModel):
    lesson_id: uuid.UUID
    student_id: uuid.UUID
    status: AttendanceStatus = Field(default=AttendanceStatus.present)


class Attendance(AttendanceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(default_factory=datetime.utcnow)
    updated_at: datetime | None = Field(default_factory=datetime.utcnow)


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(SQLModel):
    status: AttendanceStatus | None = None


class AttendancePublic(AttendanceBase):
    id: uuid.UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class AttendancesPublic(SQLModel):
    data: list[AttendancePublic]
    count: int
