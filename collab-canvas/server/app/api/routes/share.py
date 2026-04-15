"""
Sharing route handlers — generate share links and join via token.

Any authenticated user with the share token gets full edit access
to the canvas (no role-based permissions in MVP).
"""
import uuid

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.canvas import CanvasResponse, ShareResponse
from app.services import canvas_service

router = APIRouter(prefix="/canvas", tags=["sharing"])


@router.get("/{canvas_id}/share", response_model=ShareResponse)
async def get_share_info(
    canvas_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ShareResponse:
    """Return the share token and a shareable URL for a canvas."""
    canvas = canvas_service.get_canvas(canvas_id, db)
    base_url = str(request.base_url).rstrip("/")
    share_url = f"{base_url}/canvas/join/{canvas.share_token}"
    return ShareResponse(
        canvas_id=canvas.id,
        share_token=canvas.share_token,
        share_url=share_url,
    )


@router.get("/join/{share_token}", response_model=CanvasResponse)
async def join_canvas(
    share_token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CanvasResponse:
    """Look up a canvas by share token — grants the caller full edit access."""
    canvas = canvas_service.get_canvas_by_share_token(share_token, db)
    return CanvasResponse(
        id=canvas.id,
        title=canvas.title,
        owner_id=canvas.owner_id,
        share_token=canvas.share_token,
        created_at=canvas.created_at,
        updated_at=canvas.updated_at,
    )
