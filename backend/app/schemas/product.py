from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    barcode: Optional[str] = None
    category_id: int
    list_price: float = 0.0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    list_price: Optional[float] = None


class ProductResponse(ProductBase):
    id: int
    current_stock: int
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    created_by_username: Optional[str] = None
    
    class Config:
        from_attributes = True
