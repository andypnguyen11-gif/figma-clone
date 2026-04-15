"""
Canvas service — handles canvas CRUD and share-token lookups.

All database access for canvases flows through here. Route handlers
call these functions and never touch the ORM directly.
"""
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.canvas import Canvas
from app.schemas.canvas import CanvasCreate, CanvasUpdate


def create_canvas(data: CanvasCreate, owner_id: uuid.UUID, db: Session) -> Canvas:
    """Create a new canvas owned by the given user."""
    canvas = Canvas(title=data.title, owner_id=owner_id)
    db.add(canvas)
    db.commit()
    db.refresh(canvas)
    return canvas


def get_canvas(canvas_id: uuid.UUID, db: Session) -> Canvas:
    """Fetch a canvas by primary key. Raises 404 if not found."""
    canvas = db.query(Canvas).filter(Canvas.id == canvas_id).first()
    if not canvas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas not found",
        )
    return canvas


def update_canvas(
    canvas_id: uuid.UUID, data: CanvasUpdate, db: Session
) -> Canvas:
    """Partially update a canvas. Raises 404 if not found."""
    canvas = get_canvas(canvas_id, db)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(canvas, field, value)
    db.commit()
    db.refresh(canvas)
    return canvas


def get_canvas_by_share_token(token: str, db: Session) -> Canvas:
    """Look up a canvas by its share token. Raises 404 if not found."""
    canvas = db.query(Canvas).filter(Canvas.share_token == token).first()
    if not canvas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid share token",
        )
    return canvas
