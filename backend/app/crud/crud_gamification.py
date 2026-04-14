from uuid import UUID

from sqlmodel import Session, select, func

from app.models import (
    Achievement,
    AchievementCreate,
    AchievementUpdate,
    UserPoints,
    UserAchievement,
    UserAchievementCreate,
    Enrollment,
    User,
    LeaderboardEntry,
)


# ──────────────────────────────────────────────────
# Achievement CRUD
# ──────────────────────────────────────────────────

def create_achievement(
    *,
    session: Session,
    achievement_create: AchievementCreate,
) -> Achievement:
    db_obj = Achievement.model_validate(achievement_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_achievement_by_id(
    *,
    session: Session,
    achievement_id: UUID,
) -> Achievement | None:
    return session.get(Achievement, achievement_id)


def get_achievements(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Achievement]:
    statement = select(Achievement).offset(skip).limit(limit)
    return session.exec(statement).all()


def get_achievements_count(*, session: Session) -> int:
    statement = select(func.count()).select_from(Achievement)
    return session.exec(statement).one()


def update_achievement(
    *,
    session: Session,
    db_achievement: Achievement,
    achievement_in: AchievementUpdate,
) -> Achievement:
    update_data = achievement_in.model_dump(exclude_unset=True)
    db_achievement.sqlmodel_update(update_data)
    session.add(db_achievement)
    session.commit()
    session.refresh(db_achievement)
    return db_achievement


def delete_achievement(*, session: Session, db_achievement: Achievement) -> None:
    session.delete(db_achievement)
    session.commit()


# ──────────────────────────────────────────────────
# UserPoints CRUD
# ──────────────────────────────────────────────────

def get_or_create_user_points(*, session: Session, user_id: UUID) -> UserPoints:
    statement = select(UserPoints).where(UserPoints.user_id == user_id)
    record = session.exec(statement).first()
    if record is None:
        record = UserPoints(user_id=user_id, points=0)
        session.add(record)
        session.commit()
        session.refresh(record)
    return record


def add_points(*, session: Session, user_id: UUID, points: int) -> UserPoints:
    from app.models.utils import get_datetime_utc
    record = get_or_create_user_points(session=session, user_id=user_id)
    record.points += points
    record.updated_at = get_datetime_utc()
    session.add(record)
    session.commit()
    session.refresh(record)

    # auto-award achievements based on new total
    _check_and_award_achievements(session=session, user_id=user_id, total_points=record.points)

    return record


def _check_and_award_achievements(
    *, session: Session, user_id: UUID, total_points: int
) -> None:
    """Award any achievements whose threshold the user just crossed."""
    eligible = session.exec(
        select(Achievement).where(Achievement.points_required <= total_points)
    ).all()
    for achievement in eligible:
        already = session.exec(
            select(UserAchievement).where(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == achievement.id,
            )
        ).first()
        if not already:
            ua = UserAchievement(user_id=user_id, achievement_id=achievement.id)
            session.add(ua)
    session.commit()


# ──────────────────────────────────────────────────
# UserAchievement CRUD
# ──────────────────────────────────────────────────

def award_achievement(
    *,
    session: Session,
    user_achievement_create: UserAchievementCreate,
) -> UserAchievement:
    db_obj = UserAchievement.model_validate(user_achievement_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_user_achievements(
    *,
    session: Session,
    user_id: UUID,
) -> list[UserAchievement]:
    statement = (
        select(UserAchievement)
        .where(UserAchievement.user_id == user_id)
    )
    return session.exec(statement).all()


def get_user_achievement_by_id(
    *,
    session: Session,
    user_achievement_id: UUID,
) -> UserAchievement | None:
    return session.get(UserAchievement, user_achievement_id)


def user_already_has_achievement(
    *,
    session: Session,
    user_id: UUID,
    achievement_id: UUID,
) -> bool:
    statement = select(UserAchievement).where(
        UserAchievement.user_id == user_id,
        UserAchievement.achievement_id == achievement_id,
    )
    return session.exec(statement).first() is not None


# ──────────────────────────────────────────────────
# Leaderboard
# ──────────────────────────────────────────────────

def get_group_leaderboard(
    *,
    session: Session,
    group_id: UUID,
) -> list[LeaderboardEntry]:
    """
    Returns sorted leaderboard for all enrolled (active) students in a group.
    Points default to 0 if the student has no UserPoints record yet.
    """
    enrollments = session.exec(
        select(Enrollment).where(Enrollment.group_id == group_id)
    ).all()

    entries: list[LeaderboardEntry] = []
    for enrollment in enrollments:
        user = session.get(User, enrollment.student_id)
        if not user:
            continue
        pts_record = session.exec(
            select(UserPoints).where(UserPoints.user_id == user.id)
        ).first()
        points = pts_record.points if pts_record else 0
        entries.append(
            LeaderboardEntry(
                student_id=user.id,
                full_name=user.full_name,
                email=user.email,
                points=points,
                rank=0,  # assigned below
            )
        )

    entries.sort(key=lambda e: e.points, reverse=True)
    for i, entry in enumerate(entries, start=1):
        entry.rank = i

    return entries
