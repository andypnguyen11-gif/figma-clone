"""
Canvas CRUD route handlers.

All routes require authentication. Business logic is delegated
to services/canvas_service.py.
"""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.canvas import (
    CanvasCreate,
    CanvasListItemResponse,
    CanvasResponse,
    CanvasUpdate,
)
from app.services import canvas_service

router = APIRouter(prefix="/canvas", tags=["canvas"])


@router.get("", response_model=list[CanvasListItemResponse])
async def list_my_canvases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CanvasListItemResponse]:
    """Return canvases owned by the user and canvases they joined (newest first)."""
    rows = canvas_service.list_dashboard_canvases(current_user.id, db)
    return [
        CanvasListItemResponse(
            id=row.canvas.id,
            title=row.canvas.title,
            owner_id=row.canvas.owner_id,
            owner_display_name=row.owner_display_name,
            is_owner=row.is_owner,
            share_token=row.canvas.share_token,
            created_at=row.canvas.created_at,
            updated_at=row.canvas.updated_at,
        )
        for row in rows
    ]


@router.post("", response_model=CanvasResponse, status_code=status.HTTP_201_CREATED)
async def create_canvas(
    data: CanvasCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CanvasResponse:
    """Create a new canvas owned by the authenticated user."""
    canvas = canvas_service.create_canvas(data, current_user.id, db)
    return CanvasResponse(
        id=canvas.id,
        title=canvas.title,
        owner_id=canvas.owner_id,
        share_token=canvas.share_token,
        created_at=canvas.created_at,
        updated_at=canvas.updated_at,
    )


@router.get("/{canvas_id}", response_model=CanvasResponse)
async def get_canvas(
    canvas_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CanvasResponse:
    """Fetch a canvas by ID."""
    canvas = canvas_service.get_canvas(canvas_id, db)
    return CanvasResponse(
        id=canvas.id,
        title=canvas.title,
        owner_id=canvas.owner_id,
        share_token=canvas.share_token,
        created_at=canvas.created_at,
        updated_at=canvas.updated_at,
    )


@router.patch("/{canvas_id}", response_model=CanvasResponse)
async def update_canvas(
    canvas_id: uuid.UUID,
    data: CanvasUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CanvasResponse:
    """Partially update a canvas (e.g. rename)."""
    canvas = canvas_service.update_canvas(canvas_id, data, db)
    return CanvasResponse(
        id=canvas.id,
        title=canvas.title,
        owner_id=canvas.owner_id,
        share_token=canvas.share_token,
        created_at=canvas.created_at,
        updated_at=canvas.updated_at,
    )
