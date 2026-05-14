import uuid
from sqlmodel import Field, SQLModel


class ProgramTeacher(SQLModel, table=True):
    __tablename__ = "program_teacher"

    program_id: uuid.UUID = Field(foreign_key="program.id", primary_key=True, ondelete="CASCADE")
    teacher_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
