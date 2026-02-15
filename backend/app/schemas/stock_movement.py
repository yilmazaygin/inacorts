from pydantic import BaseModel
from datetime import datetime
from app.models import StockMovementType
from typing import Optional


class StockMovementBase(BaseModel):
    product_id: int
    quantity: int
    type: StockMovementType
    reason: Optional[str] = None


class StockMovementCreate(StockMovementBase):
    pass


class StockMovementResponse(StockMovementBase):
    id: int
    related_order_id: Optional[int]
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    performed_by_username: Optional[str] = None  # WHO performed this stock movement
    
    class Config:
        from_attributes = True
