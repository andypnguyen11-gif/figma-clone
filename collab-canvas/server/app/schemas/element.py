"""
Pydantic schemas for element requests and responses.

Includes all geometry, styling, and text-specific fields defined in the PRD.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ElementCreate(BaseModel):
    element_type: str = Field(description="rectangle | circle | line | triangle | text")
    x: float
    y: float
    width: float
    height: float

    fill: str = "#FFFFFF"
    stroke: str = "#000000"
    stroke_width: float = 1.0
    opacity: float = Field(default=1.0, ge=0.0, le=1.0)
    rotation: float = 0.0
    z_index: int = 0

    text_content: str | None = None
    font_size: float | None = None
    text_color: str | None = None


class ElementUpdate(BaseModel):
    x: float | None = None
    y: float | None = None
    width: float | None = None
    height: float | None = None

    fill: str | None = None
    stroke: str | None = None
    stroke_width: float | None = None
    opacity: float | None = Field(default=None, ge=0.0, le=1.0)
    rotation: float | None = None
    z_index: int | None = None

    text_content: str | None = None
    font_size: float | None = None
    text_color: str | None = None


class ElementResponse(BaseModel):
    id: uuid.UUID
    canvas_id: uuid.UUID
    element_type: str

    x: float
    y: float
    width: float
    height: float

    fill: str
    stroke: str
    stroke_width: float
    opacity: float
    rotation: float
    z_index: int

    text_content: str | None
    font_size: float | None
    text_color: str | None

    created_at: datetime
    updated_at: datetime
