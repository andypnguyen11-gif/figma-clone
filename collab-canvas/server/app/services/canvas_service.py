"""
Canvas service — handles canvas CRUD and share-token lookups.

All database access for canvases flows through here. Route handlers
call these functions and never touch the ORM directly.
"""
from dataclasses import dataclass
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.canvas import Canvas
from app.models.canvas_membership import CanvasMembership
from app.models.user import User
from app.schemas.canvas import CanvasCreate, CanvasUpdate


@dataclass(frozen=True)
class CanvasListRow:
    """One dashboard row: canvas plus owner display name and ownership flag."""

    canvas: Canvas
    owner_display_name: str
    is_owner: bool


def list_canvases_for_owner(owner_id: uuid.UUID, db: Session) -> list[Canvas]:
    """Return all canvases owned by the user, most recently updated first."""
    return (
        db.query(Canvas)
        .filter(Canvas.owner_id == owner_id)
        .order_by(Canvas.updated_at.desc())
        .all()
    )


def list_dashboard_canvases(user_id: uuid.UUID, db: Session) -> list[CanvasListRow]:
    """Return canvases the user owns plus canvases they joined via share link.

    Sorted by ``updated_at`` descending. Each row includes the canvas owner's
    ``display_name`` and whether the current user is the owner.
    """
    owned_rows = (
        db.query(Canvas, User.display_name)
        .join(User, Canvas.owner_id == User.id)
        .filter(Canvas.owner_id == user_id)
        .all()
    )
    joined_rows = (
        db.query(Canvas, User.display_name)
        .join(CanvasMembership, CanvasMembership.canvas_id == Canvas.id)
        .join(User, Canvas.owner_id == User.id)
        .filter(CanvasMembership.user_id == user_id)
        .filter(Canvas.owner_id != user_id)
        .all()
    )
    rows: list[CanvasListRow] = [
        CanvasListRow(canvas=c, owner_display_name=str(owner_name), is_owner=True)
        for c, owner_name in owned_rows
    ]
    rows.extend(
        CanvasListRow(canvas=c, owner_display_name=str(owner_name), is_owner=False)
        for c, owner_name in joined_rows
    )
    rows.sort(key=lambda r: r.canvas.updated_at, reverse=True)
    return rows


def record_canvas_join(user_id: uuid.UUID, canvas: Canvas, db: Session) -> None:
    """Persist that ``user_id`` joined ``canvas`` via share link (not the owner)."""
    if canvas.owner_id == user_id:
        return
    exists = (
        db.query(CanvasMembership)
        .filter(
            CanvasMembership.user_id == user_id,
            CanvasMembership.canvas_id == canvas.id,
        )
        .first()
    )
    if exists:
        return
    db.add(CanvasMembership(user_id=user_id, canvas_id=canvas.id))
    db.commit()


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
