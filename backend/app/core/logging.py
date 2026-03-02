"""
Advanced logging system with tiered retention:
  /logs/          — Active logs, last 7 days (YYYY-MM-DD.log)
  /logs/backups/  — Archived logs, previous 14 days
  Today's log is never deleted.

Lifecycle:
  1. Logs older than 7 days in /logs/ are moved to /logs/backups/.
  2. Logs older than 14 days in /logs/backups/ are deleted.
  3. Runs automatically on application startup.
"""

import sys
import shutil
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import Optional

from loguru import logger
from app.core.config import settings

# Resolve log directories relative to the backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
LOGS_DIR = BACKEND_DIR / "logs"
LOGS_BACKUP_DIR = LOGS_DIR / "backups"

# Remove default logger
logger.remove()

# Console output
logger.add(
    sys.stdout,
    level=settings.LOG_LEVEL,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

# Daily rotating log file in /logs/
logger.add(
    str(LOGS_DIR / "{time:YYYY-MM-DD}.log"),
    rotation="00:00",
    retention=None,  # Managed by rotate_logs() below
    level=settings.LOG_LEVEL,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
)


def rotate_logs() -> None:
    """
    Manage log file lifecycle:
      - Move logs older than 7 days from /logs/ to /logs/backups/
      - Delete logs older than 14 days from /logs/backups/
      - Never touch today's active log
    Called automatically on application startup.
    """
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    today = datetime.now().date()
    cutoff_active = today - timedelta(days=7)
    cutoff_backup = today - timedelta(days=14)

    # Phase 1: Move old logs from /logs/ to /logs/backups/
    for log_file in LOGS_DIR.glob("*.log"):
        file_date = _parse_log_date(log_file.name)
        if file_date is None:
            continue  # Skip files with unparseable names
        if file_date == today:
            continue  # Never touch today's log
        if file_date < cutoff_active:
            dest = LOGS_BACKUP_DIR / log_file.name
            try:
                shutil.move(str(log_file), str(dest))
                logger.info(f"Archived log to backups: {log_file.name}")
            except Exception as e:
                logger.error(f"Failed to archive log {log_file.name}: {e}")

    # Phase 2: Delete old logs from /logs/backups/
    for log_file in LOGS_BACKUP_DIR.glob("*.log"):
        file_date = _parse_log_date(log_file.name)
        if file_date is None:
            continue
        if file_date < cutoff_backup:
            try:
                log_file.unlink()
                logger.info(f"Deleted expired backup log: {log_file.name}")
            except Exception as e:
                logger.error(f"Failed to delete backup log {log_file.name}: {e}")


def _parse_log_date(filename: str) -> Optional[date]:
    """Parse a date from a log filename like '2026-03-03.log'."""
    try:
        name = filename.replace(".log", "")
        return datetime.strptime(name, "%Y-%m-%d").date()
    except ValueError:
        return None
