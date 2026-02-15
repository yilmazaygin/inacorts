from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest, Token, RefreshTokenRequest, TokenRefresh

router = APIRouter()


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.authenticate(request.username, request.password)


@router.post("/refresh", response_model=TokenRefresh)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.refresh_access_token(request.refresh_token)
