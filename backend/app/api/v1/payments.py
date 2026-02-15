from fastapi import APIRouter
from typing import Optional
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.payment_service import PaymentService
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PaymentResponse])
def list_payments(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 20,
    order_id: Optional[int] = None
):
    service = PaymentService(db)
    return service.list_payments(page, page_size, order_id)


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
