from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.payment_service import PaymentService
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PaymentResponse])
def list_payments(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    order_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    service = PaymentService(db)
    return service.list_payments(page, page_size, order_id, start_date, _end_of_day(end_date))


def _end_of_day(value: Optional[datetime]) -> Optional[datetime]:
    if value and value.hour == 0 and value.minute == 0 and value.second == 0 and value.microsecond == 0:
        return value.replace(hour=23, minute=59, second=59)
    return value


@router.get("/export")
def export_payments(
    current_user: CurrentUser,
    db: DatabaseSession,
    file_format: str = Query("csv", alias="format", pattern="^(csv|xlsx)$"),
    lang: str = Query("tr", pattern="^(tr|en)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    service = PaymentService(db)
    return service.export_payments(file_format, lang, start_date, _end_of_day(end_date))


@router.post("", response_model=PaymentResponse)
def create_payment(
    data: PaymentCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = PaymentService(db)
    return service.create_payment(data, current_user.id)


@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = PaymentService(db)
    service.delete_payment(payment_id, current_user.id)
    return {"message": "Payment deleted successfully"}
