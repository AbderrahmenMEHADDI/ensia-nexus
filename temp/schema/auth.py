from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.schemas.user import UserResponse, UserRole


class UserSignup(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = "STUDENT"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(..., description="Google ID token obtained from frontend")
