"""
Pydantic schemas for authentication requests and responses.

These enforce input validation at the API boundary — invalid emails,
short passwords, and missing fields are rejected before hitting
any business logic.
"""
import uuid

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Minimum 6 characters")
    display_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Returned on successful signup or login — includes the JWT."""

    id: uuid.UUID
    email: str
    display_name: str
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public user profile (no token, no password)."""

    id: uuid.UUID
    email: str
    display_name: str
