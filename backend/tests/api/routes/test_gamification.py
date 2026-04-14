"""
Tests for the Gamification module:
- Achievement CRUD (admin only)
- UserPoints retrieval and manual add
- UserAchievement award (409 on duplicate)
- Group leaderboard
"""
import uuid
from datetime import datetime

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.crud import crud_gamification, crud_enrollment, crud_group, crud_program, crud_user
from app.models import (
    AchievementCreate,
    EnrollmentCreate,
    GroupCreate,
    ProgramCreate,
    UserCreate,
    UserAchievementCreate,
)
from tests.utils.utils import random_email, random_lower_string


# ──────────────────────────────────────────────────
# Achievement CRUD
# ──────────────────────────────────────────────────

def test_create_achievement(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    data = {
        "title": "First Steps",
        "description": "Complete your first module",
        "points_required": 10,
        "icon": "star",
    }
    r = client.post(
        f"{settings.API_V1_STR}/gamification/achievements",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == data["title"]
    assert body["points_required"] == data["points_required"]
    assert "id" in body


def test_get_achievements(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    crud_gamification.create_achievement(
        session=db,
        achievement_create=AchievementCreate(
            title="Achiever", description="desc", points_required=5
        ),
    )
    r = client.get(
        f"{settings.API_V1_STR}/gamification/achievements",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert "data" in body
    assert body["count"] >= 1


def test_get_achievement_by_id(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    achievement = crud_gamification.create_achievement(
        session=db,
        achievement_create=AchievementCreate(
            title="Persistent", description="Keep going", points_required=50
        ),
    )
    r = client.get(
        f"{settings.API_V1_STR}/gamification/achievements/{achievement.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json()["id"] == str(achievement.id)


def test_get_achievement_not_found(
    client: TestClient,
    superuser_token_headers: dict[str, str],
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/gamification/achievements/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 404


def test_update_achievement(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    achievement = crud_gamification.create_achievement(
        session=db,
        achievement_create=AchievementCreate(title="Old Title", points_required=1),
    )
    r = client.patch(
        f"{settings.API_V1_STR}/gamification/achievements/{achievement.id}",
        headers=superuser_token_headers,
        json={"title": "New Title", "points_required": 100},
    )
    assert r.status_code == 200
    assert r.json()["title"] == "New Title"
    assert r.json()["points_required"] == 100


def test_delete_achievement(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    achievement = crud_gamification.create_achievement(
        session=db,
        achievement_create=AchievementCreate(title="Temporary", points_required=0),
    )
    r = client.delete(
        f"{settings.API_V1_STR}/gamification/achievements/{achievement.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    r2 = client.get(
        f"{settings.API_V1_STR}/gamification/achievements/{achievement.id}",
        headers=superuser_token_headers,
    )
    assert r2.status_code == 404


# ──────────────────────────────────────────────────
# UserPoints
# ──────────────────────────────────────────────────

def test_get_user_points(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    r = client.get(
        f"{settings.API_V1_STR}/gamification/users/{super_user.id}/points",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert "points" in body
    assert body["user_id"] == str(super_user.id)


def test_add_user_points(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    before = crud_gamification.get_or_create_user_points(
        session=db, user_id=super_user.id
    ).points

    r = client.post(
        f"{settings.API_V1_STR}/gamification/users/{super_user.id}/points/add?points=25",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    assert r.json()["points"] == before + 25


# ──────────────────────────────────────────────────
# UserAchievements
# ──────────────────────────────────────────────────

def test_award_achievement_to_user(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    achievement = crud_gamification.create_achievement(
        session=db,
        achievement_create=AchievementCreate(title="Award Test", points_required=0),
    )

    r = client.post(
        f"{settings.API_V1_STR}/gamification/users/{super_user.id}/achievements",
        headers=superuser_token_headers,
        json={"user_id": str(super_user.id), "achievement_id": str(achievement.id)},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["achievement_id"] == str(achievement.id)


def test_award_achievement_duplicate_409(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    achievement = crud_gamification.create_achievement(
        session=db,
        achievement_create=AchievementCreate(title="Unique Badge", points_required=0),
    )

    # First award
    crud_gamification.award_achievement(
        session=db,
        user_achievement_create=UserAchievementCreate(
            user_id=super_user.id, achievement_id=achievement.id
        ),
    )

    # Second award should be 409
    r = client.post(
        f"{settings.API_V1_STR}/gamification/users/{super_user.id}/achievements",
        headers=superuser_token_headers,
        json={"user_id": str(super_user.id), "achievement_id": str(achievement.id)},
    )
    assert r.status_code == 409


def test_get_user_achievements(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    r = client.get(
        f"{settings.API_V1_STR}/gamification/users/{super_user.id}/achievements",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert "data" in body
    assert "count" in body


# ──────────────────────────────────────────────────
# Leaderboard
# ──────────────────────────────────────────────────

def test_group_leaderboard(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
) -> None:
    super_user = crud_user.get_user_by_email(session=db, email=settings.FIRST_SUPERUSER)
    assert super_user is not None

    student_a = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(), password=random_lower_string(), full_name="Alice"
        ),
    )
    student_b = crud_user.create_user(
        session=db,
        user_create=UserCreate(
            email=random_email(), password=random_lower_string(), full_name="Bob"
        ),
    )

    program = crud_program.create_program(
        session=db,
        program_create=ProgramCreate(title="Leaderboard Program"),
        created_by_id=super_user.id,
    )

    group = crud_group.create_group(
        session=db,
        group_create=GroupCreate(
            name="Leaderboard Group",
            program_id=program.id,
            start_date=datetime(2026, 1, 1),
            end_date=datetime(2026, 12, 31),
        ),
    )

    crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(student_id=student_a.id, group_id=group.id),
    )
    crud_enrollment.create_enrollment(
        session=db,
        enrollment_create=EnrollmentCreate(student_id=student_b.id, group_id=group.id),
    )

    # Give student_a more points
    crud_gamification.add_points(session=db, user_id=student_a.id, points=50)
    crud_gamification.add_points(session=db, user_id=student_b.id, points=20)

    r = client.get(
        f"{settings.API_V1_STR}/gamification/groups/{group.id}/leaderboard",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["group_id"] == str(group.id)
    entries = body["entries"]
    assert len(entries) == 2
    # First entry should have more points
    assert entries[0]["points"] >= entries[1]["points"]
    assert entries[0]["rank"] == 1
    assert entries[1]["rank"] == 2
