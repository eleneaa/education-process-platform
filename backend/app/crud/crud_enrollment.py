from uuid import UUID

from sqlmodel import Session, select, func

from app.models import Enrollment, EnrollmentCreate, EnrollmentUpdate


def get_enrollment_by_student_and_group(
    *,
    session: Session,
    student_id: UUID,
    group_id: UUID,
) -> Enrollment | None:
    statement = select(Enrollment).where(
        Enrollment.student_id == student_id,
        Enrollment.group_id == group_id,
    )
    return session.exec(statement).first()


def get_enrollments_by_student(
    *,
    session: Session,
    student_id: UUID,
) -> list[Enrollment]:
    statement = select(Enrollment).where(Enrollment.student_id == student_id)
    return session.exec(statement).all()


def get_enrollments_by_group(
    *,
    session: Session,
    group_id: UUID,
) -> list[Enrollment]:
    statement = select(Enrollment).where(Enrollment.group_id == group_id)
    return session.exec(statement).all()


def create_enrollment(
    *,
    session: Session,
    enrollment_create: EnrollmentCreate,
) -> Enrollment:
    db_obj = Enrollment.model_validate(enrollment_create)

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)

    return db_obj


def get_enrollment_by_id(
    *,
    session: Session,
    enrollment_id: UUID,
) -> Enrollment | None:
    statement = select(Enrollment).where(Enrollment.id == enrollment_id)
    return session.exec(statement).first()


def get_enrollments(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Enrollment]:
    statement = (
        select(Enrollment)
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def get_enrollments_count(
    *,
    session: Session,
) -> int:
    statement = select(func.count()).select_from(Enrollment)
    return session.exec(statement).one()


def update_enrollment(
    *,
    session: Session,
    db_enrollment: Enrollment,
    enrollment_in: EnrollmentUpdate,
) -> Enrollment:
    update_data = enrollment_in.model_dump(exclude_unset=True)

    db_enrollment.sqlmodel_update(update_data)

    session.add(db_enrollment)
    session.commit()
    session.refresh(db_enrollment)

    return db_enrollment


def delete_enrollment(
    *,
    session: Session,
    db_enrollment: Enrollment,
) -> None:
    session.delete(db_enrollment)
    session.commit()