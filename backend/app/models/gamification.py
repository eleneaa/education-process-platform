import uuid
from datetime import datetime

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

from .utils import get_datetime_utc


# ────────────────────────────────────────────────────────────────────────────
# Achievement – badge / milestone definition
# ────────────────────────────────────────────────────────────────────────────

class AchievementBase(SQLModel):
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=500)
    points_required: int = Field(default=0, ge=0)
    icon: str | None = Field(default=None, max_length=255)


class AchievementCreate(AchievementBase):
    pass


class AchievementUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    points_required: int | None = Field(default=None, ge=0)
    icon: str | None = Field(default=None, max_length=255)


class Achievement(AchievementBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    user_achievements: list["UserAchievement"] = Relationship(
        back_populates="achievement"
    )


class AchievementPublic(AchievementBase):
    id: uuid.UUID
    created_at: datetime | None = None


class AchievementsPublic(SQLModel):
    data: list[AchievementPublic]
    count: int


# ────────────────────────────────────────────────────────────────────────────
# UserPoints – cumulative points per user
# ────────────────────────────────────────────────────────────────────────────

class UserPointsBase(SQLModel):
    points: int = Field(default=0, ge=0)


class UserPoints(UserPointsBase, table=True):
    __tablename__ = "userpoints"  # type: ignore

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE", unique=True)
    updated_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    user: "User" = Relationship(back_populates="points_record")  # type: ignore


class UserPointsPublic(UserPointsBase):
    id: uuid.UUID
    user_id: uuid.UUID
    updated_at: datetime | None = None


# ────────────────────────────────────────────────────────────────────────────
# UserAchievement – which user earned which achievement
# ────────────────────────────────────────────────────────────────────────────

class UserAchievementBase(SQLModel):
    user_id: uuid.UUID
    achievement_id: uuid.UUID


class UserAchievementCreate(UserAchievementBase):
    pass


class UserAchievement(UserAchievementBase, table=True):
    __tablename__ = "userachievement"  # type: ignore
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    awarded_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    achievement_id: uuid.UUID = Field(foreign_key="achievement.id", ondelete="CASCADE")

    user: "User" = Relationship(back_populates="achievements")  # type: ignore
    achievement: Achievement = Relationship(back_populates="user_achievements")


class UserAchievementPublic(UserAchievementBase):
    id: uuid.UUID
    awarded_at: datetime | None = None
    achievement: AchievementPublic | None = None


class UserAchievementsPublic(SQLModel):
    data: list[UserAchievementPublic]
    count: int


# ────────────────────────────────────────────────────────────────────────────
# Leaderboard entry (not a DB table – computed on demand)
# ────────────────────────────────────────────────────────────────────────────

class LeaderboardEntry(SQLModel):
    student_id: uuid.UUID
    full_name: str | None = None
    email: str
    points: int
    rank: int


class GroupLeaderboard(SQLModel):
    group_id: uuid.UUID
    entries: list[LeaderboardEntry]
