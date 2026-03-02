from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest, Token, RefreshTokenRequest, TokenRefresh,
    ForgotPasswordQuestionsRequest, ForgotPasswordQuestionsResponse,
    ForgotPasswordResetRequest, ForgotPasswordVerifyAnswersRequest
)
from app.schemas.user import UserResponse, VerifyPasswordRequest
from app.api.v1.dependencies import CurrentUser

router = APIRouter()


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.authenticate(request.username, request.password)


@router.post("/refresh", response_model=TokenRefresh)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.refresh_access_token(request.refresh_token)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: CurrentUser, db: Session = Depends(get_db)):
    from app.services.user_service import UserService
    user_service = UserService(db)
    return user_service.get_user(current_user.id)


@router.post("/verify-password")
def verify_password(request: VerifyPasswordRequest, current_user: CurrentUser, db: Session = Depends(get_db)):
    """Verify the current user's password. Used for admin confirmation flows."""
    from app.services.user_service import UserService
    user_service = UserService(db)
    if not user_service.verify_password(current_user.id, request.password):
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Password is incorrect")
    return {"detail": "Password verified"}


@router.post("/forgot-password/questions", response_model=ForgotPasswordQuestionsResponse)
def get_forgot_password_questions(
    request: ForgotPasswordQuestionsRequest,
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    return auth_service.get_security_questions(request.username)


@router.post("/forgot-password/verify-answers")
def verify_forgot_password_answers(
    request: ForgotPasswordVerifyAnswersRequest,
    db: Session = Depends(get_db)
):
    """Verify security answers without resetting password (step 2 of forgot password flow)."""
    auth_service = AuthService(db)
    auth_service.verify_security_answers(
        username=request.username,
        answer_1=request.security_answer_1,
        answer_2=request.security_answer_2
    )
    return {"detail": "Answers verified"}


@router.post("/forgot-password/reset")
def reset_password_with_security_answers(
    request: ForgotPasswordResetRequest,
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    auth_service.reset_password_with_security_answers(
        username=request.username,
        answer_1=request.security_answer_1,
        answer_2=request.security_answer_2,
        new_password=request.new_password
    )
    return {"detail": "Password reset successful"}
