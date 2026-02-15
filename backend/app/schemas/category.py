from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    created_by_username: Optional[str] = None
    
    class Config:
        from_attributes = True
