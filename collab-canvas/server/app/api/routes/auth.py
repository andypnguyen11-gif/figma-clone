"""
Auth route handlers — signup, login, and current-user retrieval.

Routes are thin: parse input via Pydantic, delegate to auth_service,
return the response. All business logic lives in services/auth_service.py.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    SignupRequest,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """Register a new user account and return a JWT."""
    return auth_service.signup(data, db)


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """Authenticate with email + password and return a JWT."""
    return auth_service.login(data, db)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the profile of the currently authenticated user."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
    )
