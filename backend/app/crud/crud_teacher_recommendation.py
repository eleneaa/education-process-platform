from uuid import UUID

from sqlmodel import Session, select

from app.models import TeacherRecommendation, TeacherRecommendationCreate, TeacherRecommendationUpdate


def get_recommendations_by_student(
    *,
    session: Session,
    student_id: UUID,
) -> list[TeacherRecommendation]:
    """Get all recommendations for a specific student."""
    statement = select(TeacherRecommendation).where(
        TeacherRecommendation.student_id == student_id
    )
    return session.exec(statement).all()


def get_recommendation_by_id(
    *,
    session: Session,
    recommendation_id: UUID,
) -> TeacherRecommendation | None:
    """Get a specific recommendation by ID."""
    statement = select(TeacherRecommendation).where(
        TeacherRecommendation.id == recommendation_id
    )
    return session.exec(statement).first()


def create_recommendation(
    *,
    session: Session,
    recommendation_create: TeacherRecommendationCreate,
) -> TeacherRecommendation:
    """Create a new teacher recommendation."""
    db_obj = TeacherRecommendation.model_validate(recommendation_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_recommendation(
    *,
    session: Session,
    db_recommendation: TeacherRecommendation,
    recommendation_update: TeacherRecommendationUpdate,
) -> TeacherRecommendation:
    """Update a teacher recommendation."""
    update_data = recommendation_update.model_dump(exclude_unset=True)
    db_recommendation.sqlmodel_update(update_data)
    session.add(db_recommendation)
    session.commit()
    session.refresh(db_recommendation)
    return db_recommendation


def delete_recommendation(
    *,
    session: Session,
    db_recommendation: TeacherRecommendation,
) -> None:
    """Delete a teacher recommendation."""
    session.delete(db_recommendation)
    session.commit()
