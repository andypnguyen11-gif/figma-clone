"""
Element CRUD route handlers.

All routes require authentication and a valid canvas ID.
Business logic is delegated to services/element_service.py.
"""
import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.element import ElementCreate, ElementResponse, ElementUpdate
from app.services import element_service

router = APIRouter(prefix="/canvas/{canvas_id}/elements", tags=["elements"])


def _to_response(element) -> ElementResponse:
    return ElementResponse(
        id=element.id,
        canvas_id=element.canvas_id,
        element_type=element.element_type,
        x=element.x,
        y=element.y,
        width=element.width,
        height=element.height,
        fill=element.fill,
        stroke=element.stroke,
        stroke_width=element.stroke_width,
        opacity=element.opacity,
        rotation=element.rotation,
        z_index=element.z_index,
        text_content=element.text_content,
        font_size=element.font_size,
        text_color=element.text_color,
        created_at=element.created_at,
        updated_at=element.updated_at,
    )


@router.post("", response_model=ElementResponse, status_code=status.HTTP_201_CREATED)
async def create_element(
    canvas_id: uuid.UUID,
    data: ElementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ElementResponse:
    """Create a new element on the canvas."""
    element = element_service.create_element(canvas_id, data, db)
    return _to_response(element)


@router.get("", response_model=list[ElementResponse])
async def get_elements(
    canvas_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ElementResponse]:
    """Return all elements on a canvas."""
    elements = element_service.get_elements(canvas_id, db)
    return [_to_response(e) for e in elements]


@router.patch("/{element_id}", response_model=ElementResponse)
async def update_element(
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    data: ElementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ElementResponse:
    """Partially update an element (position, styling, text, etc.)."""
    element = element_service.update_element(canvas_id, element_id, data, db)
    return _to_response(element)


@router.delete("/{element_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_element(
    canvas_id: uuid.UUID,
    element_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Delete an element from the canvas."""
    element_service.delete_element(canvas_id, element_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
