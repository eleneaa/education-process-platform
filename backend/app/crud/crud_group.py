from uuid import UUID

from sqlmodel import Session, select, func

from app.models import Group, GroupCreate, GroupUpdate
from app.models.utils import get_datetime_utc


def create_group(
    *,
    session: Session,
    group_create: GroupCreate,
) -> Group:
    db_obj = Group.model_validate(group_create)

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    return db_obj


def get_group_by_id(
    *,
    session: Session,
    group_id: UUID,
) -> Group | None:
    statement = select(Group).where(Group.id == group_id)
    return session.exec(statement).first()


def get_groups(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Group]:
    statement = (
        select(Group)
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def get_groups_count(
    *,
    session: Session,
) -> int:
    statement = select(func.count()).select_from(Group)
    return session.exec(statement).one()


def update_group(
    *,
    session: Session,
    db_group: Group,
    group_in: GroupUpdate,
) -> Group:
    update_data = group_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = get_datetime_utc()

    db_group.sqlmodel_update(update_data)

    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    return db_group


def delete_group(
    *,
    session: Session,
    db_group: Group,
) -> None:
    session.delete(db_group)
    session.commit()