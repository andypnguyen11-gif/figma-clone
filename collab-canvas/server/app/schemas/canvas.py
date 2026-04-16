"""
Pydantic schemas for canvas requests and responses.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CanvasCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class CanvasUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)


class CanvasResponse(BaseModel):
    """Full canvas representation returned by CRUD endpoints."""

    id: uuid.UUID
    title: str
    owner_id: uuid.UUID
    share_token: str
    created_at: datetime
    updated_at: datetime


class CanvasListItemResponse(BaseModel):
    """Canvas row for GET /api/canvas — owned and joined canvases with owner label."""

    id: uuid.UUID
    title: str
    owner_id: uuid.UUID
    owner_display_name: str
    is_owner: bool
    share_token: str
    created_at: datetime
    updated_at: datetime


class ShareResponse(BaseModel):
    """Returned when requesting a canvas's shareable link."""

    canvas_id: uuid.UUID
    share_token: str
    share_url: str
