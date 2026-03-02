from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72)
    email: Optional[str] = None
    is_admin: bool = False
    name: Optional[str] = None
    surname: Optional[str] = None
    address: Optional[str] = None
    backup_email: Optional[str] = None
    phone_number: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    is_admin: Optional[bool] = None
    name: Optional[str] = None
    surname: Optional[str] = None
    address: Optional[str] = None
    backup_email: Optional[str] = None
    phone_number: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Schema for users updating their own profile (non-admin fields only)."""
    email: Optional[str] = None
    name: Optional[str] = None
    surname: Optional[str] = None
    address: Optional[str] = None
    backup_email: Optional[str] = None
    phone_number: Optional[str] = None


class UserResponse(UserBase):
    id: int
    email: Optional[str] = None
    is_admin: bool
    is_active: bool
    created_by: Optional[int] = None
    created_by_username: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deactivated_at: Optional[datetime] = None
    name: Optional[str] = None
    surname: Optional[str] = None
    address: Optional[str] = None
    backup_email: Optional[str] = None
    phone_number: Optional[str] = None
    security_question_1: Optional[str] = None
    security_question_2: Optional[str] = None
    has_security_questions: bool = False
    
    class Config:
        from_attributes = True


class SecurityQuestionSetup(BaseModel):
    security_question_1: str
    security_answer_1: str
    security_question_2: str
    security_answer_2: str


class SecurityQuestionUpdate(BaseModel):
    """Schema for updating security questions with current password verification.
    Set question to empty string or null to delete that question."""
    current_password: str
    security_question_1: Optional[str] = None
    security_answer_1: Optional[str] = None
    security_question_2: Optional[str] = None
    security_answer_2: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=72)


class VerifyPasswordRequest(BaseModel):
    password: str
