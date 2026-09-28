from fastapi import APIRouter, Query, status
from typing import Optional, List
from datetime import datetime
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.order_service import OrderService
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, DeliverOrderItemRequest
from app.schemas.order_delivery import OrderDeliveryCreate, OrderDeliveryResponse
from app.schemas.common import PaginatedResponse
from app.models import OrderStatus, PaymentStatus, DeliveryStatus

router = APIRouter()


@router.get("", response_model=PaginatedResponse[OrderResponse])
def list_orders(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort: str = "id",
    order: str = "desc",
    customer_id: Optional[int] = None,
    order_status: Optional[OrderStatus] = None,
    payment_status: Optional[PaymentStatus] = None,
    delivery_status: Optional[DeliveryStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    created_by: Optional[int] = None,
    tag_id: Optional[int] = None,
):
    service = OrderService(db)
    return service.list_orders(
        page, page_size, sort, order,
        customer_id, order_status, payment_status, delivery_status,
        start_date, _end_of_day(end_date), created_by, tag_id,
    )


def _end_of_day(value: Optional[datetime]) -> Optional[datetime]:
    if value and value.hour == 0 and value.minute == 0 and value.second == 0 and value.microsecond == 0:
        return value.replace(hour=23, minute=59, second=59)
    return value


@router.get("/export")
def export_orders(
    current_user: CurrentUser,
    db: DatabaseSession,
    file_format: str = Query("csv", alias="format", pattern="^(csv|xlsx)$"),
    lang: str = Query("tr", pattern="^(tr|en)$"),
    customer_id: Optional[int] = None,
    order_status: Optional[OrderStatus] = None,
    payment_status: Optional[PaymentStatus] = None,
    delivery_status: Optional[DeliveryStatus] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    created_by: Optional[int] = None,
    tag_id: Optional[int] = None,
):
    service = OrderService(db)
    return service.export_orders(
        file_format, lang, customer_id, order_status, payment_status, delivery_status,
        start_date, _end_of_day(end_date), created_by, tag_id,
    )


@router.post("", response_model=OrderResponse)
def create_order(
    data: OrderCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = OrderService(db)
    return service.create_order(data, current_user.id)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = OrderService(db)
    return service.get_order(order_id)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    data: OrderUpdate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = OrderService(db)
    return service.update_order(order_id, data, current_user.id)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = OrderService(db)
    return service.cancel_order(order_id, current_user.id)


@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = OrderService(db)
    service.delete_order(order_id, current_user.id)
    return {"message": "Order deleted successfully"}


# Order Delivery endpoints
@router.get("/{order_id}/deliveries", response_model=List[OrderDeliveryResponse])
def list_order_deliveries(
    order_id: int,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Get delivery history for an order.
    Shows WHO delivered and WHEN for full audit trail.
    Multiple deliveries per order are supported.
    """
    service = OrderService(db)
    return service.list_order_deliveries(order_id)


@router.post("/{order_id}/deliveries", response_model=OrderDeliveryResponse, status_code=status.HTTP_201_CREATED)
def create_order_delivery(
    order_id: int,
    data: OrderDeliveryCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Record a delivery event for an order.
    Automatically tracks WHO performed the delivery.
    Supports multiple partial deliveries.
    """
    # Ensure order_id matches
    data.order_id = order_id
    service = OrderService(db)
    return service.create_order_delivery(data, current_user.id)
