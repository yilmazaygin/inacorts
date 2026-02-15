from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Annotated
from app.db.session import get_db
from app.services.auth_service import AuthService
from app.core.exceptions import UnauthorizedException
from app.models import User
from loguru import logger

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        logger.warning("Authentication attempt with missing credentials")
        raise UnauthorizedException("Authorization credentials missing")
    
    token = credentials.credentials
    auth_service = AuthService(db)
    user = auth_service.get_current_user(token)
    logger.debug(f"Authenticated request from user: {user.username} (ID: {user.id})")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DatabaseSession = Annotated[Session, Depends(get_db)]
