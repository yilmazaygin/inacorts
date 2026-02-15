from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import PaymentMethod


class PaymentBase(BaseModel):
    order_id: int
    amount: float
    method: PaymentMethod


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    received_by_username: Optional[str] = None  # WHO collected/received this payment
    
    class Config:
        from_attributes = True
