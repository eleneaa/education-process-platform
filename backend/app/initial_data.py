import logging

from sqlmodel import Session

from app.core.db import engine, init_db
from app.seed_data import seed_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init() -> None:
    session = Session(engine)
    try:
        logger.info("Initializing superuser...")
        init_db(session)
        session.commit()
        logger.info("Superuser initialized")

        logger.info("Seeding database...")
        seed_database(session)
        session.commit()
        logger.info("Database seeded and committed")
    except Exception as e:
        logger.error(f"Error during initialization: {e}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()


def main() -> None:
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created successfully")


if __name__ == "__main__":
    main()
