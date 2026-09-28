from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query

from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.core.exceptions import ForbiddenException
from app.services.export_service import ExportService

router = APIRouter()


def _end_of_day(value: Optional[datetime]) -> Optional[datetime]:
    if value and value.hour == 0 and value.minute == 0 and value.second == 0 and value.microsecond == 0:
        return value.replace(hour=23, minute=59, second=59)
    return value


@router.get("")
def export_records(
    current_user: CurrentUser,
    db: DatabaseSession,
    kind: str = Query(..., pattern="^(customers|contacts|orders|products|stock|payments|expenses|financials)$"),
    file_format: str = Query("csv", alias="format", pattern="^(csv|xlsx)$"),
    lang: str = Query("tr", pattern="^(tr|en)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    if not current_user.is_admin:
        raise ForbiddenException("Admin access required")
    service = ExportService(db)
    return service.export(kind, file_format, lang, start_date, _end_of_day(end_date))
