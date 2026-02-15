from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ContactBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    website: Optional[str] = None


class ContactCreate(ContactBase):
    customer_ids: list[int] = []


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    customer_ids: Optional[list[int]] = None


# Simple customer info for ContactResponse (avoid circular import)
class CustomerInfo(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        from_attributes = True


class ContactResponse(ContactBase):
    id: int
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    created_by_username: Optional[str] = None
    customers: List[CustomerInfo] = []
    
    class Config:
        from_attributes = True
