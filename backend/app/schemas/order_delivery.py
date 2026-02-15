from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OrderDeliveryBase(BaseModel):
    order_id: int
    note: Optional[str] = None
    delivered_at: Optional[datetime] = None


class OrderDeliveryCreate(OrderDeliveryBase):
    pass


class OrderDeliveryResponse(OrderDeliveryBase):
    id: int
    delivered_by_user_id: int
    delivered_by_username: Optional[str] = None  # WHO performed the delivery
    created_at: datetime
    
    class Config:
        from_attributes = True
