from pydantic import BaseModel, Field
from typing import Optional


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str = Field(..., max_length=150)
    password: str = Field(..., max_length=72)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordQuestionsRequest(BaseModel):
    username: str


class ForgotPasswordQuestionsResponse(BaseModel):
    security_question_1: Optional[str] = None
    security_question_2: Optional[str] = None
    has_questions: bool = False


class ForgotPasswordResetRequest(BaseModel):
    username: str
    security_answer_1: str
    security_answer_2: str
    new_password: str = Field(..., min_length=6, max_length=72)


class ForgotPasswordVerifyAnswersRequest(BaseModel):
    username: str
    security_answer_1: str
    security_answer_2: str
