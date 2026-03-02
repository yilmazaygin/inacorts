"""
Weekly database backup module.

Creates a backup of the SQLite database once per week.
Backup files are stored in: database/backups/backup_YYYY_week_NN.db
Only ONE weekly backup exists at a time — previous backups are deleted
automatically when a new one is created.
Checks on application startup whether this week's backup already exists.
"""

import shutil
from datetime import datetime
from pathlib import Path

from app.core.logging import logger


# Resolve paths relative to the backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
DATABASE_PATH = BACKEND_DIR.parent / "database" / "inacorts.db"
BACKUP_DIR = BACKEND_DIR.parent / "database" / "backups"


def _get_weekly_backup_name() -> str:
    """Return the backup filename for the current ISO week: backup_YYYY_week_NN.db"""
    now = datetime.now()
    iso_year, iso_week, _ = now.isocalendar()
    return f"backup_{iso_year}_week_{iso_week:02d}.db"


def _delete_old_backups(current_backup_name: str) -> None:
    """Delete all previous weekly backup files except the current one."""
    for old_backup in BACKUP_DIR.glob("backup_*.db"):
        if old_backup.name != current_backup_name:
            try:
                old_backup.unlink()
                logger.info(f"Deleted previous weekly backup: {old_backup.name}")
            except Exception as e:
                logger.error(f"Failed to delete old backup {old_backup.name}: {e}")


def run_weekly_backup() -> None:
    """Create a weekly backup of the database if one doesn't already exist for this week.
    Deletes any previous weekly backups to keep only one at a time."""
    backup_name = _get_weekly_backup_name()
    backup_path = BACKUP_DIR / backup_name

    # Ensure backup directory exists
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    if backup_path.exists():
        logger.info(f"Weekly backup already exists: {backup_name}")
        # Still clean up any stale older backups
        _delete_old_backups(backup_name)
        return

    if not DATABASE_PATH.exists():
        logger.warning(f"Database file not found at {DATABASE_PATH}, skipping backup")
        return

    try:
        shutil.copy2(str(DATABASE_PATH), str(backup_path))
        logger.info(f"Weekly database backup created: {backup_name}")
        # Delete previous weekly backups after successful new backup
        _delete_old_backups(backup_name)
    except Exception as e:
        logger.error(f"Failed to create weekly backup: {e}")
