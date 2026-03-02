from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    UserCreate, UserUpdate, UserProfileUpdate, UserResponse,
    SecurityQuestionSetup, SecurityQuestionUpdate, ChangePasswordRequest
)
from app.schemas.common import PaginatedResponse
from app.core.security import hash_password, verify_password
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from math import ceil
from loguru import logger


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)
    
    def _build_response(self, user) -> UserResponse:
        response = UserResponse.model_validate(user)
        if user.created_by_user:
            response.created_by_username = user.created_by_user.username
        response.has_security_questions = bool(
            user.security_question_1 and user.security_question_2
        )
        # Include security question text (never answers)
        response.security_question_1 = user.security_question_1
        response.security_question_2 = user.security_question_2
        return response
    
    def get_user(self, user_id: int) -> UserResponse:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return self._build_response(user)
    
    def list_users(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None
    ) -> PaginatedResponse[UserResponse]:
        items, total = self.repo.list_all(page, page_size, search)
        responses = [self._build_response(item) for item in items]
        return PaginatedResponse(
            items=responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=ceil(total / page_size) if total > 0 else 0
        )
    
    def create_user(self, data: UserCreate, created_by_user_id: int) -> UserResponse:
        # Check if username already exists
        existing = self.repo.get_by_username(data.username)
        if existing:
            raise BadRequestException("Username already exists")
        
        # Check if email already exists
        if data.email:
            existing_email = self.repo.get_by_email(data.email)
            if existing_email:
                raise BadRequestException("Email already exists")
        
        logger.info(f"Creating user: {data.username} (by user {created_by_user_id})")
        hashed_pw = hash_password(data.password)
        user = self.repo.create(
            username=data.username,
            hashed_password=hashed_pw,
            is_admin=data.is_admin,
            email=data.email,
            created_by=created_by_user_id,
            name=data.name,
            surname=data.surname,
            address=data.address,
            backup_email=data.backup_email,
            phone_number=data.phone_number
        )
        logger.info(f"User created successfully - ID: {user.id}, Username: {user.username}")
        return self._build_response(user)
    
    def update_user(self, user_id: int, data: UserUpdate) -> UserResponse:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        update_data = data.model_dump(exclude_unset=True)
        if "email" in update_data and update_data["email"]:
            existing_email = self.repo.get_by_email(update_data["email"])
            if existing_email and existing_email.id != user_id:
                raise BadRequestException("Email already exists")
        
        user = self.repo.update(user, **update_data)
        logger.info(f"User updated - ID: {user.id}, Username: {user.username}")
        return self._build_response(user)
    
    def update_profile(self, user_id: int, data: UserProfileUpdate) -> UserResponse:
        """Allow a user to update their own profile fields (non-admin fields)."""
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        update_data = data.model_dump(exclude_unset=True)
        if "email" in update_data and update_data["email"]:
            existing_email = self.repo.get_by_email(update_data["email"])
            if existing_email and existing_email.id != user_id:
                raise BadRequestException("Email already exists")
        
        user = self.repo.update(user, **update_data)
        logger.info(f"User profile updated - ID: {user.id}, Username: {user.username}")
        return self._build_response(user)
    
    def deactivate_user(self, user_id: int, current_user_id: int) -> UserResponse:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        if user.id == current_user_id:
            raise BadRequestException("Cannot deactivate your own account")
        
        if not user.is_active:
            raise BadRequestException("User is already deactivated")
        
        user = self.repo.deactivate(user)
        logger.info(f"User deactivated - ID: {user.id}, Username: {user.username}")
        return self._build_response(user)
    
    def setup_security_questions(self, user_id: int, data: SecurityQuestionSetup) -> UserResponse:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        # Normalize answers: trim + lowercase, then hash
        answer_1_normalized = data.security_answer_1.strip().lower()
        answer_2_normalized = data.security_answer_2.strip().lower()
        
        answer_1_hash = hash_password(answer_1_normalized)
        answer_2_hash = hash_password(answer_2_normalized)
        
        user = self.repo.set_security_questions(
            user,
            question_1=data.security_question_1.strip(),
            answer_1_hash=answer_1_hash,
            question_2=data.security_question_2.strip(),
            answer_2_hash=answer_2_hash
        )
        logger.info(f"Security questions set for user - ID: {user.id}, Username: {user.username}")
        return self._build_response(user)
    
    def update_security_questions(self, user_id: int, data: SecurityQuestionUpdate) -> UserResponse:
        """Update security questions with current password verification.
        Allows partial updates — deleting one question while keeping the other."""
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        # Verify current password first
        if not verify_password(data.current_password, user.hashed_password):
            raise BadRequestException("Current password is incorrect")
        
        # Determine new values for each question
        q1 = data.security_question_1
        a1_hash = None
        q2 = data.security_question_2
        a2_hash = None
        
        # If question is provided and non-empty, hash the answer
        if q1 and q1.strip():
            if not data.security_answer_1 or not data.security_answer_1.strip():
                raise BadRequestException("Answer is required when setting a security question")
            a1_hash = hash_password(data.security_answer_1.strip().lower())
            q1 = q1.strip()
        else:
            q1 = None  # Delete question 1
        
        if q2 and q2.strip():
            if not data.security_answer_2 or not data.security_answer_2.strip():
                raise BadRequestException("Answer is required when setting a security question")
            a2_hash = hash_password(data.security_answer_2.strip().lower())
            q2 = q2.strip()
        else:
            q2 = None  # Delete question 2
        
        user = self.repo.set_security_questions(
            user,
            question_1=q1,
            answer_1_hash=a1_hash,
            question_2=q2,
            answer_2_hash=a2_hash
        )
        logger.info(f"Security questions updated for user - ID: {user.id}, Username: {user.username}")
        return self._build_response(user)
    
    def verify_password(self, user_id: int, password: str) -> bool:
        """Verify a user's current password. Used for admin confirmations."""
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return verify_password(password, user.hashed_password)
    
    def change_password(self, user_id: int, data: ChangePasswordRequest) -> UserResponse:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        if not verify_password(data.current_password, user.hashed_password):
            raise BadRequestException("Current password is incorrect")
        
        hashed_pw = hash_password(data.new_password)
        user = self.repo.update_password(user, hashed_pw)
        logger.info(f"Password changed for user - ID: {user.id}, Username: {user.username}")
        return self._build_response(user)
