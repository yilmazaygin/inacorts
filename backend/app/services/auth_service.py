from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, hash_password
from app.core.jwt import create_access_token, create_refresh_token, decode_token
from app.core.exceptions import UnauthorizedException, BadRequestException, NotFoundException
from app.schemas.auth import Token, TokenRefresh, ForgotPasswordQuestionsResponse
from app.schemas.user import UserResponse
from loguru import logger


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
    
    def authenticate(self, username: str, password: str) -> Token:
        logger.info(f"Login attempt for user: {username}")
        
        # Block service accounts from interactive login
        if username == "system":
            logger.warning(f"Login attempt blocked for service account: {username}")
            raise UnauthorizedException("Invalid username or password")
        
        user = self.user_repo.get_by_username(username)
        
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"Failed login attempt for user: {username} - Invalid credentials")
            raise UnauthorizedException("Invalid username or password")
        
        if not user.is_active:
            logger.warning(f"Failed login attempt for user: {username} - Account inactive")
            raise UnauthorizedException("User account is inactive")
        
        access_token = create_access_token({"sub": str(user.id), "username": user.username, "is_admin": user.is_admin})
        refresh_token = create_refresh_token({"sub": str(user.id), "username": user.username, "is_admin": user.is_admin})
        
        logger.info(f"Successful login for user: {username} (ID: {user.id})")
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )
    
    def refresh_access_token(self, refresh_token: str) -> TokenRefresh:
        payload = decode_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            logger.warning("Token refresh failed - Invalid refresh token")
            raise UnauthorizedException("Invalid refresh token")
        
        user_id = int(payload.get("sub"))
        user = self.user_repo.get_by_id(user_id)
        
        if not user or not user.is_active:
            logger.warning(f"Token refresh failed for user ID: {user_id} - User invalid or inactive")
            raise UnauthorizedException("Invalid user")
        
        access_token = create_access_token({"sub": str(user.id), "username": user.username, "is_admin": user.is_admin})
        
        logger.info(f"Access token refreshed for user: {user.username} (ID: {user.id})")
        
        return TokenRefresh(access_token=access_token)
    
    def get_current_user(self, token: str):
        payload = decode_token(token)
        
        if not payload or payload.get("type") != "access":
            logger.debug("Authentication failed - Invalid access token")
            raise UnauthorizedException("Invalid access token")
        
        user_id = int(payload.get("sub"))
        user = self.user_repo.get_by_id(user_id)
        
        if not user or not user.is_active:
            logger.warning(f"Authentication failed for user ID: {user_id} - User invalid or inactive")
            raise UnauthorizedException("Invalid user")
        
        return user
    
    def get_security_questions(self, username: str) -> ForgotPasswordQuestionsResponse:
        user = self.user_repo.get_by_username(username)
        
        if not user:
            # Return empty response to avoid leaking whether user exists
            return ForgotPasswordQuestionsResponse(has_questions=False)
        
        if not user.is_active:
            return ForgotPasswordQuestionsResponse(has_questions=False)
        
        if not user.security_question_1 or not user.security_question_2:
            return ForgotPasswordQuestionsResponse(has_questions=False)
        
        return ForgotPasswordQuestionsResponse(
            security_question_1=user.security_question_1,
            security_question_2=user.security_question_2,
            has_questions=True
        )
    
    def reset_password_with_security_answers(
        self, username: str, answer_1: str, answer_2: str, new_password: str
    ) -> None:
        user = self.user_repo.get_by_username(username)
        
        if not user or not user.is_active:
            raise BadRequestException("Invalid request")
        
        if not user.security_question_1 or not user.security_question_2:
            raise BadRequestException("Security questions not set")
        
        # Normalize answers: trim + lowercase
        answer_1_normalized = answer_1.strip().lower()
        answer_2_normalized = answer_2.strip().lower()
        
        # Verify both answers
        if not verify_password(answer_1_normalized, user.security_answer_1_hash):
            logger.warning(f"Password reset failed for user: {username} - Wrong answer 1")
            raise BadRequestException("Security answers are incorrect")
        
        if not verify_password(answer_2_normalized, user.security_answer_2_hash):
            logger.warning(f"Password reset failed for user: {username} - Wrong answer 2")
            raise BadRequestException("Security answers are incorrect")
        
        # Reset password
        hashed_pw = hash_password(new_password)
        self.user_repo.update_password(user, hashed_pw)
        logger.info(f"Password reset successful for user: {username} (ID: {user.id})")
    
    def verify_security_answers(self, username: str, answer_1: str, answer_2: str) -> bool:
        """Verify security answers without resetting password.
        Used in the multi-step forgot password flow."""
        user = self.user_repo.get_by_username(username)
        
        if not user or not user.is_active:
            raise BadRequestException("Invalid request")
        
        if not user.security_question_1 or not user.security_question_2:
            raise BadRequestException("Security questions not set")
        
        # Normalize answers: trim + lowercase
        answer_1_normalized = answer_1.strip().lower()
        answer_2_normalized = answer_2.strip().lower()
        
        # Verify both answers
        if not verify_password(answer_1_normalized, user.security_answer_1_hash):
            logger.warning(f"Security answer verification failed for user: {username} - Wrong answer 1")
            raise BadRequestException("Security answers are incorrect")
        
        if not verify_password(answer_2_normalized, user.security_answer_2_hash):
            logger.warning(f"Security answer verification failed for user: {username} - Wrong answer 2")
            raise BadRequestException("Security answers are incorrect")
        
        logger.info(f"Security answers verified for user: {username}")
        return True
