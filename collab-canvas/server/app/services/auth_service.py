"""
Authentication service — handles user creation and credential verification.

All password handling goes through core.security so raw passwords never
touch the database layer. Raises HTTPException for known error states
(duplicate email, bad credentials) so routes stay thin.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, SignupRequest


def signup(data: SignupRequest, db: Session) -> AuthResponse:
    """Create a new user account and return an auth response with JWT.

    Raises 409 if the email is already registered.
    """
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        display_name=data.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))

    return AuthResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        access_token=token,
    )


def login(data: LoginRequest, db: Session) -> AuthResponse:
    """Authenticate with email + password and return an auth response with JWT.

    Returns a generic 401 for both wrong-email and wrong-password to
    avoid leaking whether an account exists.
    """
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(str(user.id))

    return AuthResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        access_token=token,
    )
