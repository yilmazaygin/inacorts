from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, hash_password
from app.core.jwt import create_access_token, create_refresh_token, decode_token
from app.core.exceptions import UnauthorizedException
from app.schemas.auth import Token, TokenRefresh
from loguru import logger


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
    
    def authenticate(self, username: str, password: str) -> Token:
        logger.info(f"Login attempt for user: {username}")
        user = self.user_repo.get_by_username(username)
        
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"Failed login attempt for user: {username} - Invalid credentials")
            raise UnauthorizedException("Invalid username or password")
        
        if not user.is_active:
            logger.warning(f"Failed login attempt for user: {username} - Account inactive")
            raise UnauthorizedException("User account is inactive")
        
        access_token = create_access_token({"sub": str(user.id), "username": user.username})
        refresh_token = create_refresh_token({"sub": str(user.id), "username": user.username})
        
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
        
        access_token = create_access_token({"sub": str(user.id), "username": user.username})
        
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
