from fastapi import APIRouter
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.order_service import OrderService
from app.schemas.order import OrderResponse, DeliverOrderItemRequest

router = APIRouter()


@router.post("/{item_id}/deliver", response_model=OrderResponse)
def deliver_order_item(
    item_id: int,
    data: DeliverOrderItemRequest,
    current_user: CurrentUser,
    db: DatabaseSession
):
    service = OrderService(db)
    return service.deliver_order_item(item_id, data, current_user.id)
