"""
Cursor presence: Redis persistence and WebSocket broadcast payloads.

Each ``cursor:move`` refreshes a TTL key so idle cursors expire without a cron.
"""

from __future__ import annotations

import json
import uuid

from redis import Redis

from app.models.user import User
from app.redis import presence as presence_redis
from app.services import user_palette
from app.websocket.events import EVENT_CURSOR_MOVE, EVENT_USER_LEFT


def handle_cursor_move(
    redis_client: Redis,
    canvas_id: uuid.UUID,
    user: User,
    x: float,
    y: float,
) -> dict[str, object]:
    """Store presence in Redis and return the JSON broadcast for the room."""
    color = user_palette.user_color_hex(user.id)
    stored = {
        "x": x,
        "y": y,
        "user_name": user.display_name,
        "color": color,
    }
    presence_redis.set_cursor(
        redis_client,
        canvas_id,
        user.id,
        json.dumps(stored),
    )
    return {
        "event": EVENT_CURSOR_MOVE,
        "canvas_id": str(canvas_id),
        "user_id": str(user.id),
        "user_name": user.display_name,
        "color": color,
        "x": x,
        "y": y,
    }


def clear_on_disconnect(
    redis_client: Redis,
    canvas_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Drop the Redis key when the WebSocket session ends."""
    presence_redis.delete_cursor(redis_client, canvas_id, user_id)


def user_left_payload(canvas_id: uuid.UUID, user_id: uuid.UUID) -> dict[str, object]:
    """Notify peers that this user's cursor should disappear immediately."""
    return {
        "event": EVENT_USER_LEFT,
        "canvas_id": str(canvas_id),
        "user_id": str(user_id),
    }
