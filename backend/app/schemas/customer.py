from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CustomerBase(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


class CustomerCreate(CustomerBase):
    contact_ids: list[int] = []


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    contact_ids: Optional[list[int]] = None


# Simple contact info for CustomerResponse (avoid circular import)
class ContactInfo(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    
    class Config:
        from_attributes = True


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    contacts: List[ContactInfo] = []
    created_by_username: Optional[str] = None
    
    class Config:
        from_attributes = True
