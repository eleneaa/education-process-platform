#!/usr/bin/env python
"""Ensure seed data exists in the database."""
import sys
import logging
from sqlmodel import Session, select

from app.core.db import engine
from app.models import User
from app.crud import crud_user
from app.models import UserCreate
from app.models.enums import UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def ensure_admin_exists():
    """Ensure admin user exists."""
    session = Session(engine)
    try:
        # Check if admin exists
        admin = session.exec(
            select(User).where(User.email == "admin@example.com")
        ).first()

        if admin:
            logger.info(f"✓ Admin user exists: {admin.email}")
            return

        # Create admin
        logger.info("Creating admin user...")
        admin_in = UserCreate(
            email="admin@example.com",
            password="changethis",
            is_superuser=True,
            role=UserRole.ADMIN,
        )
        admin = crud_user.create_user(session=session, user_create=admin_in)
        session.commit()
        session.flush()
        logger.info(f"✓ Created admin user: {admin.email}")

    except Exception as e:
        logger.error(f"Error ensuring admin exists: {e}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    try:
        ensure_admin_exists()
        logger.info("✓ Data verification complete")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)
