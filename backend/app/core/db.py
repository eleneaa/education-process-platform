from sqlmodel import Session, create_engine, select

from app.crud import crud_user
from app.core.config import settings
from app.models import User, UserCreate
from app import models  # noqa: F401 - Ensure all models are imported and registered

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    from sqlmodel import SQLModel

    # Ensure all models are imported and registered before creating tables
    # Import all models explicitly to register them with SQLModel.metadata
    import app.models  # noqa: F401

    # This works because the models are already imported and registered from app.models
    SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        from app.models.enums import UserRole
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
            role=UserRole.ADMIN,
        )
        user = crud_user.create_user(session=session, user_create=user_in)
