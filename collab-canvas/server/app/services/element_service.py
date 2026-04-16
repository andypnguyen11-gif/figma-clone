"""
Element service — handles CRUD for canvas elements (shapes).

Validates that the parent canvas exists before any mutation.
Updates and deletes return 423 when another user holds the Redis lock;
mutations are allowed if no lock key exists (solo edit / before WS acquire).
"""
import uuid

from fastapi import HTTPException, status
from redis import Redis
from sqlalchemy.orm import Session

from app.models.element import Element
from app.schemas.element import ElementCreate, ElementUpdate
from app.services.canvas_service import get_canvas
from app.services.lock_service import ensure_element_lock


def create_element(
    canvas_id: uuid.UUID, data: ElementCreate, db: Session
) -> Element:
    """Add a new element to a canvas. Raises 404 if the canvas doesn't exist."""
    get_canvas(canvas_id, db)

    element = Element(
        canvas_id=canvas_id,
        element_type=data.element_type,
        x=data.x,
        y=data.y,
        width=data.width,
        height=data.height,
        fill=data.fill,
        stroke=data.stroke,
        stroke_width=data.stroke_width,
        opacity=data.opacity,
        rotation=data.rotation,
        z_index=data.z_index,
        text_content=data.text_content,
        font_size=data.font_size,
        text_color=data.text_color,
    )
    db.add(element)
    db.commit()
    db.refresh(element)
    return element


def get_elements(canvas_id: uuid.UUID, db: Session) -> list[Element]:
    """Return all elements belonging to a canvas. Raises 404 if canvas doesn't exist."""
    get_canvas(canvas_id, db)
    return db.query(Element).filter(Element.canvas_id == canvas_id).all()


def update_element(
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    data: ElementUpdate,
    db: Session,
    user_id: uuid.UUID,
    redis_client: Redis,
) -> Element:
    """Partially update an element. Raises 404 if not found, 423 if not lock holder."""
    element = (
        db.query(Element)
        .filter(Element.id == element_id, Element.canvas_id == canvas_id)
        .first()
    )
    if not element:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Element not found",
        )

    ensure_element_lock(redis_client, canvas_id, element_id, user_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(element, field, value)
    db.commit()
    db.refresh(element)
    return element


def delete_element(
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    db: Session,
    user_id: uuid.UUID,
    redis_client: Redis,
) -> None:
    """Delete an element. Raises 404 if not found, 423 if not lock holder."""
    element = (
        db.query(Element)
        .filter(Element.id == element_id, Element.canvas_id == canvas_id)
        .first()
    )
    if not element:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Element not found",
        )

    ensure_element_lock(redis_client, canvas_id, element_id, user_id)

    db.delete(element)
    db.commit()
