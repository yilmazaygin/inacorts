from pydantic import BaseModel, field_validator
from typing import List, Literal, Optional
from datetime import datetime


def _blank_sku(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    text = value.strip()
    return text or None


class ProductBase(BaseModel):
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    category_id: int
    list_price: float = 0.0
    show_on_site: bool = True

    @field_validator("sku", mode="before")
    @classmethod
    def normalize_sku(cls, value):
        return _blank_sku(value)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    list_price: Optional[float] = None
    show_on_site: Optional[bool] = None

    @field_validator("sku", mode="before")
    @classmethod
    def normalize_sku(cls, value):
        return _blank_sku(value)


class BulkPriceUpdate(BaseModel):
    product_ids: List[int]
    mode: Literal["percent", "amount"]
    value: float


class ProductResponse(ProductBase):
    id: int
    current_stock: int
    image_url: Optional[str] = None
    image_urls: List[str] = []
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    created_by_username: Optional[str] = None
    
    class Config:
        from_attributes = True
