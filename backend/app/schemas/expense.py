from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ExpenseCategoryResponse(ExpenseCategoryBase):
    id: int
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    created_by_username: Optional[str] = None
    
    class Config:
        from_attributes = True


class ExpenseBase(BaseModel):
    amount: float
    description: str
    category_id: int
    date: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    date: Optional[datetime] = None


class ExpenseResponse(BaseModel):
    id: int
    amount: float
    description: str
    category_id: int
    date: Optional[datetime] = None
    created_at: datetime
    created_by: int
    updated_at: datetime
    updated_by: int
    created_by_username: Optional[str] = None  # WHO created this expense
    category_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ExpenseHistoryResponse(BaseModel):
    id: int
    expense_id: int
    changed_at: datetime
    changed_by: int
    changed_by_username: Optional[str] = None
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    
    class Config:
        from_attributes = True
