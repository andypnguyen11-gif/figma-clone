"""
Broadcast canvas element mutations to WebSocket rooms after successful REST writes.

Uses the in-process :class:`~app.websocket.manager.ConnectionManager`; multi-worker
deployments will add Redis pub/sub fan-out later.
"""

from __future__ import annotations

import uuid

from app.models.element import Element
from app.schemas.element import ElementResponse
from app.websocket.events import (
    EVENT_ELEMENT_CREATED,
    EVENT_ELEMENT_DELETED,
    EVENT_ELEMENT_UPDATED,
)
from app.websocket.manager import connection_manager


def _element_payload(element: Element) -> dict[str, object]:
    r = ElementResponse.model_validate(element, from_attributes=True)
    return r.model_dump(mode="json")


async def broadcast_element_created(canvas_id: uuid.UUID, element: Element) -> None:
    await connection_manager.broadcast_json(
        canvas_id,
        {
            "event": EVENT_ELEMENT_CREATED,
            "canvas_id": str(canvas_id),
            "element": _element_payload(element),
        },
    )


async def broadcast_element_updated(canvas_id: uuid.UUID, element: Element) -> None:
    await connection_manager.broadcast_json(
        canvas_id,
        {
            "event": EVENT_ELEMENT_UPDATED,
            "canvas_id": str(canvas_id),
            "element": _element_payload(element),
        },
    )


async def broadcast_element_deleted(canvas_id: uuid.UUID, element_id: uuid.UUID) -> None:
    await connection_manager.broadcast_json(
        canvas_id,
        {
            "event": EVENT_ELEMENT_DELETED,
            "canvas_id": str(canvas_id),
            "element_id": str(element_id),
        },
    )
