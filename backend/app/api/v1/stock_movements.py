from fastapi import APIRouter
from typing import Optional
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.services.stock_movement_service import StockMovementService
from app.schemas.stock_movement import StockMovementCreate, StockMovementResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[StockMovementResponse])
def list_stock_movements(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = 1,
    page_size: int = 20,
    product_id: Optional[int] = None
):
    service = StockMovementService(db)
    return service.list_stock_movements(page, page_size, product_id)


@router.post("", response_model=StockMovementResponse)
def create_stock_movement(
    data: StockMovementCreate,
    current_user: CurrentUser,
    db: DatabaseSession
):
    """
    Create a manual stock movement.
    Supports IN, OUT, and ADJUSTMENT types.
    Automatically tracks WHO performed the movement.
    """
    service = StockMovementService(db)
    return service.create_stock_movement(data, current_user.id)
