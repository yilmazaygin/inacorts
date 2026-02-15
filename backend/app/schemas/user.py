from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    is_admin: bool = False


class UserResponse(UserBase):
    id: int
    is_admin: bool
    is_active: bool
    
    class Config:
        from_attributes = True
