from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.services.user_service import UserService
from app.schemas.user import (
    UserCreate, UserUpdate, UserProfileUpdate, UserResponse,
    SecurityQuestionSetup, SecurityQuestionUpdate, ChangePasswordRequest
)
from app.schemas.common import PaginatedResponse
from app.api.v1.dependencies import CurrentUser, DatabaseSession
from app.core.exceptions import ForbiddenException

router = APIRouter()


def _require_admin(current_user):
    """Raise ForbiddenException if the current user is not an admin."""
    if not current_user.is_admin:
        raise ForbiddenException("Admin access required")


@router.get("", response_model=PaginatedResponse)
def list_users(
    current_user: CurrentUser,
    db: DatabaseSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None
):
    _require_admin(current_user)
    user_service = UserService(db)
    return user_service.list_users(page=page, page_size=page_size, search=search)


@router.post("", response_model=UserResponse, status_code=201)
def create_user(data: UserCreate, current_user: CurrentUser, db: DatabaseSession):
    _require_admin(current_user)
    user_service = UserService(db)
    return user_service.create_user(data, created_by_user_id=current_user.id)


# /me routes must be before /{user_id} to avoid path conflicts
@router.put("/me", response_model=UserResponse)
def update_my_profile(data: UserProfileUpdate, current_user: CurrentUser, db: DatabaseSession):
    """Allow the current user to update their own profile fields."""
    user_service = UserService(db)
    return user_service.update_profile(current_user.id, data)


@router.put("/me/security-questions", response_model=UserResponse)
def setup_security_questions(data: SecurityQuestionSetup, current_user: CurrentUser, db: DatabaseSession):
    user_service = UserService(db)
    return user_service.setup_security_questions(current_user.id, data)


@router.put("/me/security-questions-update", response_model=UserResponse)
def update_security_questions(data: SecurityQuestionUpdate, current_user: CurrentUser, db: DatabaseSession):
    """Update security questions with current password verification. Supports partial updates."""
    user_service = UserService(db)
    return user_service.update_security_questions(current_user.id, data)


@router.post("/me/change-password", response_model=UserResponse)
def change_password(data: ChangePasswordRequest, current_user: CurrentUser, db: DatabaseSession):
    user_service = UserService(db)
    return user_service.change_password(current_user.id, data)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, current_user: CurrentUser, db: DatabaseSession):
    _require_admin(current_user)
    user_service = UserService(db)
    return user_service.get_user(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, current_user: CurrentUser, db: DatabaseSession):
    _require_admin(current_user)
    user_service = UserService(db)
    return user_service.update_user(user_id, data)


@router.post("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(user_id: int, current_user: CurrentUser, db: DatabaseSession):
    _require_admin(current_user)
    user_service = UserService(db)
    return user_service.deactivate_user(user_id, current_user_id=current_user.id)
