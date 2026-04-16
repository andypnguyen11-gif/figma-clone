"""
JWT validation for WebSocket connections.

REST handlers use ``Authorization: Bearer``; browser WebSocket APIs cannot
set arbitrary headers, so the client passes the same JWT as a ``token``
query parameter on ``/api/canvas/{canvas_id}/ws``.

Unlike ``decode_access_token`` in ``security.py`` (which raises
``HTTPException``), failures here raise ``WebSocketAuthError`` so the
route can close the socket without an HTTP response body.
"""

import uuid

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User


class WebSocketAuthError(Exception):
    """Token missing, invalid signature, expired, or user does not exist."""


def require_ws_user(token: str | None, db: Session) -> User:
    """Parse the JWT from the query string and load the ``User`` row.

    Raises:
        WebSocketAuthError: If authentication cannot be completed.
    """
    if token is None or not str(token).strip():
        raise WebSocketAuthError("Missing token")
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        sub = payload.get("sub")
        if sub is None:
            raise WebSocketAuthError("Invalid token")
        user_id = uuid.UUID(str(sub))
    except (JWTError, ValueError, TypeError):
        raise WebSocketAuthError("Invalid token") from None

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise WebSocketAuthError("User not found")
    return user
