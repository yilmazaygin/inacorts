"""
INACORTS — Database Reset Utility

Drops every table, recreates the schema, and re-seeds required default rows
(admin user, system user, default expense categories) via init_db.

This is a LOCAL / DEV tool — never run it against a production database.

Usage
─────
  cd backend
  python -m app.utils.reset_db            # interactive confirmation
  python -m app.utils.reset_db --yes      # skip confirmation (CI / scripts)
"""

import sys
from app.db.session import engine, SessionLocal
from app.db.base import Base, import_models
from app.db.init_db import init_db
from loguru import logger

# Make sure every model is registered with SQLAlchemy metadata
import_models()


def reset_database(*, skip_confirm: bool = False) -> None:
    logger.info("=" * 55)
    logger.info("  INACORTS — Database Reset Utility")
    logger.info("=" * 55)

    if not skip_confirm:
        answer = input("\n⚠  This will DELETE ALL DATA. Continue? (yes / no): ").strip().lower()
        if answer != "yes":
            logger.info("Aborted.")
            return

    # 1. Drop all tables
    logger.info("Dropping all tables…")
    Base.metadata.drop_all(bind=engine)

    # 2. Recreate schema
    logger.info("Recreating tables…")
    Base.metadata.create_all(bind=engine)

    # 3. Seed required default rows (admin, system user, expense categories)
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()

    logger.info("")
    logger.info("✓ Database has been reset successfully.")
    logger.info("  Default users: admin / admin  •  system (internal)")
    logger.info("  Default expense categories re-created.")
    logger.info("=" * 55)


if __name__ == "__main__":
    skip = "--yes" in sys.argv or "-y" in sys.argv
    reset_database(skip_confirm=skip)
