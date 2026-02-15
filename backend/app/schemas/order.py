from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import PaymentStatus, DeliveryStatus, OrderStatus


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int
    delivered_quantity: int
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    customer_id: int
    items: list[OrderItemCreate]


class OrderUpdate(BaseModel):
    customer_id: Optional[int] = None


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    payment_status: PaymentStatus
    delivery_status: DeliveryStatus
    order_status: OrderStatus
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    created_by_username: Optional[str] = None  # WHO created this order
    items: list[OrderItemResponse] = []
    
    class Config:
        from_attributes = True


class DeliverOrderItemRequest(BaseModel):
    quantity: int
