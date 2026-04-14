from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.crud import crud_gamification
from app.api.deps import SessionDep, CurrentUser, CurrentAdmin
from app.models import (
    AchievementCreate,
    AchievementPublic,
    AchievementUpdate,
    AchievementsPublic,
    UserPointsPublic,
    UserAchievementCreate,
    UserAchievementPublic,
    UserAchievementsPublic,
    GroupLeaderboard,
)

router = APIRouter(
    prefix="/gamification",
    tags=["Gamification"],
)


# ────────────────────────────────────────────────────────────────
# Achievements management (admin only)
# ────────────────────────────────────────────────────────────────

@router.get("/achievements", response_model=AchievementsPublic)
def read_achievements(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """List all available achievements."""
    achievements = crud_gamification.get_achievements(
        session=session, skip=skip, limit=limit
    )
    count = crud_gamification.get_achievements_count(session=session)
    return AchievementsPublic(data=achievements, count=count)


@router.post("/achievements", response_model=AchievementPublic)
def create_achievement(
    *,
    session: SessionDep,
    achievement_in: AchievementCreate,
    current_user: CurrentAdmin,
) -> Any:
    """Create a new achievement definition (admin only)."""
    achievement = crud_gamification.create_achievement(
        session=session, achievement_create=achievement_in
    )
    return achievement


@router.get("/achievements/{achievement_id}", response_model=AchievementPublic)
def read_achievement(
    achievement_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Get achievement by id."""
    achievement = crud_gamification.get_achievement_by_id(
        session=session, achievement_id=achievement_id
    )
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return achievement


@router.patch("/achievements/{achievement_id}", response_model=AchievementPublic)
def update_achievement(
    *,
    session: SessionDep,
    achievement_id: UUID,
    achievement_in: AchievementUpdate,
    current_user: CurrentAdmin,
) -> Any:
    """Update achievement (admin only)."""
    achievement = crud_gamification.get_achievement_by_id(
        session=session, achievement_id=achievement_id
    )
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    achievement = crud_gamification.update_achievement(
        session=session, db_achievement=achievement, achievement_in=achievement_in
    )
    return achievement


@router.delete("/achievements/{achievement_id}")
def delete_achievement(
    *,
    session: SessionDep,
    achievement_id: UUID,
    current_user: CurrentAdmin,
) -> Any:
    """Delete achievement (admin only)."""
    achievement = crud_gamification.get_achievement_by_id(
        session=session, achievement_id=achievement_id
    )
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    crud_gamification.delete_achievement(session=session, db_achievement=achievement)
    return {"ok": True}


# ────────────────────────────────────────────────────────────────
# User points & achievements
# ────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/points", response_model=UserPointsPublic)
def read_user_points(
    user_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Get total points for a user."""
    from app.models.enums import UserRole
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and user_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    record = crud_gamification.get_or_create_user_points(
        session=session, user_id=user_id
    )
    return record


@router.post("/users/{user_id}/points/add", response_model=UserPointsPublic)
def add_user_points(
    user_id: UUID,
    points: int,
    session: SessionDep,
    current_user: CurrentAdmin,
) -> Any:
    """Manually add points to a user (admin only)."""
    if points <= 0:
        raise HTTPException(status_code=422, detail="Points must be positive")
    record = crud_gamification.add_points(
        session=session, user_id=user_id, points=points
    )
    return record


@router.get("/users/{user_id}/achievements", response_model=UserAchievementsPublic)
def read_user_achievements(
    user_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """Get all achievements earned by a user."""
    from app.models.enums import UserRole
    if (
        current_user.role == UserRole.STUDENT
        and not current_user.is_superuser
        and user_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not enough privileges")

    user_achievements = crud_gamification.get_user_achievements(
        session=session, user_id=user_id
    )
    return UserAchievementsPublic(data=user_achievements, count=len(user_achievements))


@router.post("/users/{user_id}/achievements", response_model=UserAchievementPublic)
def award_achievement_to_user(
    user_id: UUID,
    *,
    session: SessionDep,
    achievement_in: UserAchievementCreate,
    current_user: CurrentAdmin,
) -> Any:
    """Manually award an achievement to a user (admin only). Returns 409 if already awarded."""
    already = crud_gamification.user_already_has_achievement(
        session=session,
        user_id=user_id,
        achievement_id=achievement_in.achievement_id,
    )
    if already:
        raise HTTPException(
            status_code=409,
            detail="User already has this achievement",
        )
    ua = crud_gamification.award_achievement(
        session=session,
        user_achievement_create=UserAchievementCreate(
            user_id=user_id,
            achievement_id=achievement_in.achievement_id,
        ),
    )
    return ua


# ────────────────────────────────────────────────────────────────
# Leaderboard
# ────────────────────────────────────────────────────────────────

@router.get("/groups/{group_id}/leaderboard", response_model=GroupLeaderboard)
def read_group_leaderboard(
    group_id: UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get points-based leaderboard for all students in a group.
    Available to all authenticated users.
    """
    entries = crud_gamification.get_group_leaderboard(
        session=session, group_id=group_id
    )
    return GroupLeaderboard(group_id=group_id, entries=entries)
